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

let MetascanClient;

const ON_SCAN_COMPLETE_LISTENERS = [];

/**
 *
 * @param metascanClient
 * @constructor
 */
function FileProcessor(metascanClient) {

    MetascanClient = metascanClient;

    this.browserMessage = BrowserMessage;
    this.processTarget = processTarget;
    this.getDownloadedFile = getDownloadedFile;
    this.handleFileScanResults = handleFileScanResults;
    this.startStatusPolling = startStatusPolling;
    this.init = init;
    this.addOnScanCompleteListener = addOnScanCompleteListener;
    this.removeOnScanCompleteListener = removeOnScanCompleteListener;
    this.callOnScanCompleteListeners = callOnScanCompleteListeners;
}

async function init() {
    await settings.init();
    await apikeyInfo.init();
    await scanHistory.init();
}

export default FileProcessor;

async function processTarget(linkUrl, downloadItem) {

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

    // check hash on mcl
    try {
        let response = await MetascanClient.setAuth(apikeyInfo.apikey).hash.lookup(file.md5);

        if (response.error) {
            if (response.error.code === MetascanClient.ERROR_CODE.HASH_NOT_FOUND) {
                // send to scan
                response = await MetascanClient.setAuth(apikeyInfo.apikey).file.upload({
                    fileName: file.fileName,
                    fileData,
                    sampleSharing: settings.shareResults,
                    canBeSanitized: file.canBeSanitized
                });
    
                if (response.error) {
                    throw response.error;
                }

                file.dataId = response.data_id;
                scanHistory.save();
                await this.startStatusPolling(file, linkUrl, fileData);
                return;
            }
            throw response.error;            
        }

        this.handleFileScanResults(file, response, linkUrl, fileData, !!downloadItem);
    }
    catch (reject){
        console.error(reject);
    }
}

/**
 *
 * @param localPath
 * @returns {Promise}
 */
async function getDownloadedFile(localPath) {
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
 * Register callback that will run on scan complete with file data
 * @param {*} callback 
 */
function addOnScanCompleteListener(callback) {
    ON_SCAN_COMPLETE_LISTENERS.push(callback);
}

/**
 * Remove registered callback
 * @param {*} callback 
 */
function removeOnScanCompleteListener(callback) {
    const index = ON_SCAN_COMPLETE_LISTENERS.indexOf(callback);

    if (index > -1) {
        ON_SCAN_COMPLETE_LISTENERS.splice(index, 1);
    }
}
/**
 * Call all registered listeners and pass the payload
 * @param {*} payload 
 */
function callOnScanCompleteListeners(payload) {
    if (!ON_SCAN_COMPLETE_LISTENERS.length) {
        return;
    }

    for (let i=0; i<ON_SCAN_COMPLETE_LISTENERS.length; i++) {
        ON_SCAN_COMPLETE_LISTENERS[i](payload);
    }
}
/**
 *
 * @param file
 * @param info
 * @param linkUrl
 * @param fileData
 * @param downloaded
 * @returns {Promise.<void>}
 */
async function handleFileScanResults(file, info, linkUrl, fileData, downloaded) {
    file.status = ScanFile.getScanStatus(info.scan_results.scan_all_result_i);
    file.statusLabel = ScanFile.getScanStatusLabel(info.scan_results.scan_all_result_i);
    file.sha256 = info.file_info.sha256;
    file.dataId = info.data_id;
    file.scanResults = `${MCL.config.mclDomain}/results#!/file/${file.dataId}/regular/overview`;

    if (info.sanitized && info.sanitized.file_path && !Object.prototype.hasOwnProperty.call(file, 'sanitizedFileURL')) {
        file.sanitizedFileURL = info.sanitized.file_path;
    }

    await scanHistory.save();
    this.browserMessage.send({
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
 * @param file
 * @param linkUrl
 * @param fileData
 * @returns {Promise.<void>}
 */
async function startStatusPolling(file, linkUrl, fileData) {
    if (!file.dataId){
        scanHistory.files.splice(scanHistory.files.indexOf(file), 1);
        scanHistory.save();
        return;
    }

    file.scanResults = `${MCL.config.mclDomain}/results#!/file/${file.dataId}/regular/overview`;
    await scanHistory.save();

    let response = await MetascanClient.setAuth(apikeyInfo.apikey).file.poolForResults(file.dataId, 3000);

    if (response.error) {
        return;
    }

    this.handleFileScanResults(file, response, linkUrl, fileData);
}
