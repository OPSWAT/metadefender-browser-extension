'use strict';

import 'chromereload/devonly';

import { SANITIZATION_FILE_TYPES } from '../constants/file';
import { BROWSER_EVENT } from './browser/browser-message-event';
import decodeFileName from './angular/decodeuri.filter';
import ScanFile from './scan-file';

import { settings } from '../common/persistent/settings';
import { apikeyInfo } from '../common/persistent/apikey-info';
import { scanHistory } from '../common/persistent/scan-history';
import BrowserNotification from '../common/browser/browser-notification';
import BrowserMessage from '../common/browser/browser-message';
import CoreClient from '../common/core-client';
import MetascanClient from '../common/metascan-client';

const ON_SCAN_COMPLETE_LISTENERS = [];

/**
 *
 * @constructor
 */
class FileProcessor {
    /**
     * Proccess a link to a file or a downloaded file.
     * 
     * @param {string} linkUrl file url 
     * @param {*} downloadItem https://developer.chrome.com/extensions/downloads#type-DownloadItem
     */
    async processTarget(linkUrl, downloadItem) {

        if (!apikeyInfo.apikey) {
            BrowserNotification.create(chrome.i18n.getMessage('undefinedApiKey'));
            return;
        }

        let file = new ScanFile();

        if (ScanFile.isSanitizedFile(linkUrl)) {
            return;
        }

        if (downloadItem) {
            file.fileName = downloadItem.filename.split('/').pop();
            file.size = downloadItem.fileSize;
        }
        else {
            file.fileName = linkUrl.split('/').pop();
            file.fileName = file.fileName.split('?')[0];
            try {
                file.size = await ScanFile.getFileSize(linkUrl, file.fileName);
            }
            catch (errMsg) {
                if (errMsg) {
                    BrowserNotification.create(errMsg);
                }
                return;
            }
        }

        file.fileName = decodeFileName(file.fileName);

        file.extension = file.fileName.split('.').pop();
        file.canBeSanitized = file.extension && SANITIZATION_FILE_TYPES.indexOf(file.extension.toLowerCase()) > -1;

        if (file.size === null ) {
            BrowserNotification.create(chrome.i18n.getMessage('fileEmpty'));
            return;
        }

        if (file.size > MCL.config.fileSizeLimit) {
            BrowserNotification.create(chrome.i18n.getMessage('fileSizeLimitExceeded'));
            return;
        }

        file.statusLabel = ScanFile.getScanStatusLabel();

        await scanHistory.addFile(file);

        let fileData = null;

        if (downloadItem) {
            try {
                fileData = await this.getDownloadedFile(downloadItem.localPath || 'file://' + downloadItem.filename);
                BrowserNotification.create(chrome.i18n.getMessage('scanStarted') + file.fileName, file.id);
            }
            catch (e) {
                BrowserNotification.create(e, file.id);
                scanHistory.removeFile(file);
                return;
            }
        }
        else {
            if (file.size === 0) {
                BrowserNotification.create(chrome.i18n.getMessage('fileEmpty'));
                return;
            }

            BrowserNotification.create(chrome.i18n.getMessage('scanStarted') + file.fileName, file.id);
            fileData = await ScanFile.getFileData(linkUrl, file.fileName);
        }

        file.md5 = ScanFile.getMd5Hash(fileData);

        if (file.fileName === '') {
            file.fileName = file.md5;
        }

        this.scanFile(file, linkUrl, fileData, downloadItem, settings.useCore, settings.corev4);
    }

    /**
     * Load a local file content.
     * 
     * @param {string} localPath local file path
     * @returns {Promise}
     */
    async getDownloadedFile(localPath) {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.responseType = 'arraybuffer';
            xhr.onreadystatechange = function () {
                if (this.readyState === XMLHttpRequest.DONE) {
                    if (this.status === 0 && this.response === null) {
                        reject(chrome.i18n.getMessage('errorCors'));
                    }

                    resolve(this.response);
                }
            };
            xhr.open('GET', localPath);
            xhr.send();
        });
    }

    /**
     * Register callback that will run on scan complete with file data.
     * 
     * @param {*} callback 
     */
    addOnScanCompleteListener(callback) {
        ON_SCAN_COMPLETE_LISTENERS.push(callback);
    }

    /**
     * Remove registered callback.
     * 
     * @param {*} callback 
     */
    removeOnScanCompleteListener(callback) {
        const index = ON_SCAN_COMPLETE_LISTENERS.indexOf(callback);

        if (index > -1) {
            ON_SCAN_COMPLETE_LISTENERS.splice(index, 1);
        }
    }

    /**
     * Call all registered listeners and pass the payload.
     * 
     * @param {*} payload 
     */
    callOnScanCompleteListeners(payload) {
        if (!ON_SCAN_COMPLETE_LISTENERS.length) {
            return;
        }

        for (let i=0; i<ON_SCAN_COMPLETE_LISTENERS.length; i++) {
            ON_SCAN_COMPLETE_LISTENERS[i](payload);
        }
    }

    /**
     * 
     * @param {*} file file info
     * @param {*} info file scan result
     * @param {string} linkUrl file file url
     * @param {*} fileData file content
     * @param {boolean} downloaded flag for files that are already downloaded
     * @returns {Promise.<void>}
     */
    async handleFileScanResults(file, info, linkUrl, fileData, downloaded) {
        if (info.scan_results) {
            file.status = ScanFile.getScanStatus(info.scan_results.scan_all_result_i);
            file.statusLabel = ScanFile.getScanStatusLabel(info.scan_results.scan_all_result_i);
        }
        file.sha256 = info.file_info.sha256;
        file.dataId = info.data_id;
        
        if (file.useCore) {
            if (settings.corev4 === true){
                file.scanResults = `${settings.coreUrl}/#/user/dashboard/processinghistory/dataId/${file.dataId}`;

            } else {
                file.scanResults = `${settings.coreUrl}/#/user/scanResult?type=dataId&value=${file.dataId}`;
            }
            const postProcessing =  info.process_info && info.process_info.post_processing;
            const sanitizationSuccessfull = postProcessing && postProcessing.sanitization_details && postProcessing.sanitization_details.description === 'Sanitized successfully.';
            const sanitized = postProcessing && postProcessing.actions_ran.indexOf('Sanitized') !== -1;
            if (sanitizationSuccessfull || sanitized) {
                const sanitizedFileURL = `${settings.coreUrl}/file/converted/${file.dataId}?apikey=${settings.coreApikey}`;
                // verify if the user has access
                if (await CoreClient.file.checkSanitized(sanitizedFileURL)) {
                    file.sanitizedFileURL = sanitizedFileURL;
                }
            }
        }
        else {
            file.scanResults = `${MCL.config.mclDomain}/results#!/file/${file.dataId}/regular/overview`;
            if (info.sanitized && info.sanitized.file_path && !Object.prototype.hasOwnProperty.call(file, 'sanitizedFileURL')) {
                file.sanitizedFileURL = info.sanitized.file_path;
            }
        }

        await scanHistory.save();
        BrowserMessage.send({
            event: BROWSER_EVENT.SCAN_COMPLETE
        });

        let notificationMessage = file.fileName + chrome.i18n.getMessage('fileScanComplete');
        notificationMessage += (file.status === ScanFile.STATUS.INFECTED) ? chrome.i18n.getMessage('threatDetected') : chrome.i18n.getMessage('noThreatDetected');

        BrowserNotification.create(notificationMessage, file.id, file.status === ScanFile.STATUS.INFECTED);

        this.callOnScanCompleteListeners({
            status: file.status,
            downloaded,
            fileData,
            linkUrl,
            name: file.fileName
        });
    }

    /**
     *
     * @param {*} file file info
     * @param {string} linkUrl  file file url
     * @param {*} fileData file content
     * @param {boolean} downloaded flag for files that are already downloaded
     * @returns {Promise.<void>}
     */
    async startStatusPolling(file, linkUrl, fileData, downloaded) {
        let response;
       
        if (file.useCore) {
            if (settings.corev4 === true){
                file.scanResults = `${settings.coreUrl}/#/user/dashboard/processinghistory/dataId/${file.dataId}`;

            } else { 
                file.scanResults = `${settings.coreUrl}/#/user/scanResult?type=dataId&value=${file.dataId}`;
            }

            await scanHistory.save();
            response = await CoreClient.file.poolForResults(file.dataId, 3000);

        }
        else {
            file.scanResults = `${MCL.config.mclDomain}/results#!/file/${file.dataId}/regular/overview`;
            await scanHistory.save();
            response = await MetascanClient.setAuth(apikeyInfo.apikey).file.poolForResults(file.dataId, 3000);
        }
        
        if (response.error) {
            return;
        }

        this.handleFileScanResults(file, response, linkUrl, fileData, downloaded);
    }

    /**
     * 
     * @param {*} file file information 
     * @param {string} linkUrl file url
     * @param {*} fileData file content
     * @param {*} downloadItem https://developer.chrome.com/extensions/downloads#type-DownloadItem
     * @param {boolean} useCore use core API instead of cloud
     */
    async scanFile(file, linkUrl, fileData, downloadItem, useCore) {
        try {
            file.useCore = useCore;
            scanHistory.save();

            let response = useCore
                ? await this.scanWithCore(file, fileData)
                : await this.scanWithCloud(file, fileData);

            if (!response.data_id) {
                throw response;
            }

            file.dataId = response.data_id;
            scanHistory.save();
            await this.startStatusPolling(file, linkUrl, fileData, !!downloadItem);

        } catch (error) {
            BrowserNotification.create(chrome.i18n.getMessage('scanFileError'));
            _gaq.push(['exception', {exDescription: 'file-processor:scanFile' + JSON.stringify(error)}]);
        }
    }

    /**
     * Scan a file using Metadefender Core
     * 
     * @param {*} file file information 
     * @param {*} fileData file content
     */
    async scanWithCore(file, fileData) {
        let response = await CoreClient.hash.lookup(file.md5);

        if (response[file.md5] === 'Not Found') {
            response = await CoreClient.file.upload({
                fileData: fileData,
                fileName: file.fileName,
                rule: settings.coreRule
            });
        }

        return response;
    }

    /**
     * Scan a file using Metadefender Cloud
     * 
     * @param {*} file file information 
     * @param {*} fileData file content
     */
    async scanWithCloud(file, fileData) {
        let response = await MetascanClient.setAuth(apikeyInfo.apikey).hash.lookup(file.md5);

        if (response.error && response.error.code === MetascanClient.ERROR_CODE.HASH_NOT_FOUND) {
            response = await MetascanClient.setAuth(apikeyInfo.apikey).file.upload({
                fileName: file.fileName,
                fileData,
                sampleSharing: settings.shareResults,
                canBeSanitized: file.canBeSanitized
            });
        }

        return response;
    }
}

export default new FileProcessor();