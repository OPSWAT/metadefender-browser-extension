'use strict';

import MCL from '../../config/config';
import { SANITIZATION_FILE_TYPES } from '../constants/file';
import ScanFile from './scan-file';
import BrowserNotification from '../common/browser/browser-notification';
import CoreClient from '../common/core-client';
import MetascanClient from '../common/metascan-client';
import { apikeyInfo } from '../common/persistent/apikey-info';
import { scanHistory } from '../common/persistent/scan-history';
import { settings } from '../common/persistent/settings';

import '../common/ga-tracking';

export const ON_SCAN_COMPLETE_LISTENERS = [];
class FileProcessor {
    /**
     * Proccess a link to a file or a downloaded file.
     * 
     * @param {string} linkUrl file url 
     * @param {*} downloadItem https://developer.chrome.com/extensions/downloads#type-DownloadItem
     * @param {boolean} useDLP scan using DLP
     */
    async processTarget(linkUrl, downloadItem, useDLP) {
        await apikeyInfo.load();
        if (!apikeyInfo.data.apikey) {
            BrowserNotification.create(chrome.i18n.getMessage('undefinedApiKey'));
            return;
        }
        
        const file = new ScanFile();

        if (file.isSanitizedFile(linkUrl)) {
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
                file.size = file.getFileSize(linkUrl, file.fileName);
            }
            catch (errMsg) {
                if (errMsg) {
                    BrowserNotification.create(errMsg);
                }
                return;
            }
        }

        file.extension = file.fileName.split('.').pop();
        file.useDLP = useDLP ? useDLP : false;
        file.canBeSanitized = useDLP || file.extension && SANITIZATION_FILE_TYPES.indexOf(file.extension.toLowerCase()) > -1;

        if (file.size === null) {
            BrowserNotification.create(chrome.i18n.getMessage('fileEmpty'));
            return;
        }
        if (parseInt(file.size) > parseInt(MCL.config.fileSizeLimit)) {
            BrowserNotification.create(chrome.i18n.getMessage('fileSizeLimitExceeded'));
            return;
        }

        file.statusLabel = file.getScanStatusLabel();

        let fileData = null;

        if (downloadItem) {
            try {
                fileData = await this.getDownloadedFile(downloadItem.localPath || 'file://' + downloadItem.filename);
                BrowserNotification.create(chrome.i18n.getMessage('scanStarted') + file.fileName, file.id);
            }
            catch (e) {
                BrowserNotification.create(e, file.id);
                await scanHistory.removeFile(file);
                return;
            }
        }
        else {
            if (file.size === 0) {
                BrowserNotification.create(chrome.i18n.getMessage('fileEmpty'));
                return;
            }

            BrowserNotification.create(chrome.i18n.getMessage('scanStarted') + file.fileName, file.id);
            fileData = await file.getFileData(linkUrl);
        }

        file.md5 = file.getMd5Hash(fileData);

        if (file.fileName === '') {
            file.fileName = file.md5;
        }

        await scanHistory.addFile(file);

        await this.scanFile(file, linkUrl, fileData, downloadItem, settings.data.useCore);
    }

    /**
     * Load a local file content.
     * 
     * @param {string} localPath local file path
     * @returns {Promise}
     */
    async getDownloadedFile(localPath) {
        return fetch(localPath);
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

        for (const element of ON_SCAN_COMPLETE_LISTENERS) {
            element(payload);
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

        console.log('file-processor handleFileScanResults info', info);

        if (info.scan_results) {
            file.status = new ScanFile().getScanStatus(info.scan_results.scan_all_result_i);
            file.statusLabel = new ScanFile().getScanStatusLabel(info.scan_results.scan_all_result_i);
        }
        file.sha256 = info.file_info.sha256;
        file.dataId = info.data_id;
        
        if (file.useCore) {
            if (settings.data.coreV4 === true){
                file.scanResults = `${settings.data.coreUrl}/#/user/dashboard/processingHistory/dataId/${file.dataId}`;
            } else {
                file.scanResults = `${settings.data.coreUrl}/#/user/scanResult?type=dataId&value=${file.dataId}`;
            }
            const postProcessing = info.process_info?.post_processing;
            const sanitizationSuccessfull = postProcessing?.sanitization_details?.description === 'Sanitized successfully.';
            const sanitized = postProcessing?.actions_ran.indexOf('Sanitized') !== -1;

            if (sanitizationSuccessfull || sanitized) {
                const sanitizedFileURL = `${settings.data.coreUrl}/file/converted/${file.dataId}?apikey=${settings.data.coreApikey}`;
                // verify if the user has access
                if (await CoreClient.file.checkSanitized(sanitizedFileURL)) {
                    file.sanitizedFileURL = sanitizedFileURL;
                }
            }
        }
        else {
            file.scanResults = `${MCL.config.mclDomain}/results/file/${file.dataId}/regular/overview`;
            if (info?.sanitized?.file_path && !Object.prototype.hasOwnProperty.call(file, 'sanitizedFileURL')) {
                file.sanitizedFileURL = info.sanitized.file_path;
            }
        }
        
        await scanHistory.updateFileById(file.id, file);
        await scanHistory.save();

        let notificationMessage = file.fileName + chrome.i18n.getMessage('fileScanComplete');
        notificationMessage += (file.status === ScanFile.STATUS.INFECTED) ? chrome.i18n.getMessage('threatDetected') : chrome.i18n.getMessage('noThreatDetected');
        await BrowserNotification.create(notificationMessage, file.id, file.status === ScanFile.STATUS.INFECTED);

        console.log('file-processor handleFileScanResults file', file);

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
            if (settings.data.coreV4 === true){
                file.scanResults = `${settings.data.coreUrl}/#/user/dashboard/processingHistory/dataId/${file.dataId}`;
            } else {
                file.scanResults = `${settings.data.coreUrl}/#/user/scanResult?type=dataId&value=${file.dataId}`;
            }
            await scanHistory.save();
            response = await CoreClient.file.poolForResults(file.dataId, 3000);
        } else {
            file.scanResults = `${MCL.config.mclDomain}/results/file/${file.dataId}/regular/overview`;
            await scanHistory.save();
            response = await MetascanClient.setAuth(apikeyInfo.data.apikey).file.poolForResults(file.dataId, 3000);
        }
        
        if (response.error) {
            return; 
        }

        await this.handleFileScanResults(file, response, linkUrl, fileData, downloaded);
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

            const response = useCore
                ? await this.scanWithCore(file, fileData)
                : await this.scanWithCloud(file, fileData);

            console.log('file-processor scanFile response', response);

            if (!response.data_id) {
                throw response;
            }

            file.dataId = response?.data_id;
            
            await this.startStatusPolling(file, linkUrl, fileData, !!downloadItem);
        } catch (error) {
            file.scan_results = {
                scan_all_result_i: 10
            };
            file.status = file.getScanStatus(file.scan_results.scan_all_result_i);
            file.statusLabel = file.getScanStatusLabel(file.scan_results.scan_all_result_i);
            BrowserNotification.create(chrome.i18n.getMessage('scanFileError'));
            global._gaq?.push(['exception', { exDescription: 'file-processor:scanFile' + JSON.stringify(error) }]);
        }

        scanHistory.updateFileById(file.id, file);
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
                rule: settings.data.coreRule
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
        let response;
        try {
            response = await MetascanClient.setAuth(apikeyInfo.data.apikey).hash.lookup(file.md5);

            if (!response || !response.data_id || response.error) {
                response = await MetascanClient.setAuth(apikeyInfo.data.apikey).file.upload({
                    fileName: file.fileName,
                    fileData,
                    sampleSharing: settings.data.shareResults,
                    canBeSanitized: file.canBeSanitized,
                    useDLP: file.useDLP,
                });
            }
        } catch (error) {
            console.warn(error);
        }

        return response;
    }
}

export default new FileProcessor();
