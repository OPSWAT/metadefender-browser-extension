import moment from 'moment';
import SparkMD5 from 'spark-md5';
import uniqid from 'uniqid';
import MCL from '../../config/config';
import { SCAN_STATUS } from '../constants/file';

function ScanFile() {
    return {
        id: uniqid(),
        fileName: null,
        scanTime: moment().unix(),
        sha256: null,
        md5: null,
        status: ScanFile.STATUS.SCANNING,
        scanResults: null,
        size: null,
        dataId: null,

        // methods
        getScanStatus: getScanStatus,
        getScanStatusLabel: getScanStatusLabel,
        isSanitizedFile: isSanitizedFile,
        getFileName: getFileName,
        getFileData: getFileData,
        getMd5Hash: getMd5Hash,
    };
}

export default ScanFile;

// const
ScanFile.STATUS = SCAN_STATUS.VALUES;

ScanFile.STATUS_VALUES_CLEAN = SCAN_STATUS.CLEAN_VALUES;
ScanFile.STATUS_VALUES_INFECTED = SCAN_STATUS.INFECTED_VALUES;

/**
 * Checks if an URL points to a sanitized file.
 * 
 * @param {string} url a file url
 * @returns {boolean} `true` if the url provided is of a sanitized file
 */
function isSanitizedFile(url) {
    const urlLow = url.toLowerCase();

    // metadefender cloud sanitized files
    for (let bucket of MCL.config.sanitizationBuckets) {
        if (urlLow.indexOf(bucket) > -1) {
            return true;
        }
    }

    // metadefender core sanitized files
    if (urlLow.indexOf('/file/converted/') > -1 && urlLow.indexOf('?apikey=') > -1) {
        return true;
    }
}

/**
 * Extract the filename from a file url or a downloaded file.
 *
 * @param {string} url file url
 * @param {*} downloadItem https://developer.chrome.com/extensions/downloads#type-DownloadItem
 */
async function getFileName(url, downloadItem) {
    if (downloadItem) {
        return downloadItem.filename;
    }
    const fileUrl = await fetch(url, { method: 'HEAD', redirect: 'follow' })
        .then(response => response.url)
        .catch(() => linkUrl);

    const path = fileUrl.split('/').pop();
    return path.split('?').shift();
}

/**
 * Download a file.
 *
 * @param {string} url File url
 * @returns {Promise<Blob>} File data as a Blob object
 */
async function getFileData(url) {
    if (/^data/i.test(url)) {
        throw Error(chrome.i18n.getMessage('unsupportedUrl'));
    }

    if (/^ftp/i.test(url)) {
        throw Error(chrome.i18n.getMessage('unableToScanFTP'));
    }

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw Error(chrome.i18n.getMessage('errorWhileDownloading'));
            }
            return response.blob();
        })
        .catch(() => {
            throw Error(chrome.i18n.getMessage('errorWhileDownloading'));
        });
}

/**
 * 'clean' | 'infected' | 'scanning'
 * @param status
 */
function getScanStatus(status) {
    if (typeof status === 'undefined') {
        return ScanFile.STATUS.SCANNING;
    }

    if (ScanFile.STATUS_VALUES_CLEAN.indexOf(status) !== -1) {
        return ScanFile.STATUS.CLEAN;
    }

    if (ScanFile.STATUS_VALUES_INFECTED.indexOf(status) !== -1) {
        return ScanFile.STATUS.INFECTED;
    }

    return ScanFile.STATUS.UNKNOWN;
}

function getScanStatusLabel(status) {
    if (typeof status === 'undefined') {
        status = 255;
    }
    return chrome.i18n.getMessage('scanResult' + status);
}

/**
 * Generate a file hash.
 *
 * @param {Blob} file File data as a Blob object
 * @returns {Promise<string>} The MD5 hash of the file data
 */
async function getMd5Hash(file) {
    const spark = new SparkMD5.ArrayBuffer();
    const fileArrayBuffer = await file.arrayBuffer();
    spark.append(fileArrayBuffer);
    return spark.end().toUpperCase();
}
