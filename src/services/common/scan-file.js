import mime from 'mime-types';
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
        download: download,
        isSanitizedFile: isSanitizedFile,
        getFileSize: getFileSize,
        getFileData: getFileData,
        getMd5Hash: getMd5Hash,
    };
}

export default ScanFile;

// const
ScanFile.STATUS = SCAN_STATUS.VALUES;

ScanFile.STATUS_VALUES_CLEAN = SCAN_STATUS.CLEAN_VALUES;
ScanFile.STATUS_VALUES_INFECTED = SCAN_STATUS.INFECTED_VALUES;


async function download(link, fileData, fileName) {
    let fileUrl;
    let URL;

    if (typeof window !== 'undefined') {
        URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
    }

    const fileExtension = fileName?.match(/(?<=\.)[^.]*$/);
    const fileType = Array.isArray(fileExtension) ? mime.lookup(fileExtension[0]) : 'text/plain';

    try {
        fileUrl = URL.createObjectURL(new Blob([fileData], { type: fileType }));
    }
    catch (e) {
        // fallback
        fileUrl = link;
    }

    return new Promise((resolve) => {
        chrome.downloads.download({
            url: fileUrl,
            filename: fileName
        }, (downloadId) => {
            resolve(downloadId);
        });
    });
}

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

function getFileSize(url, filename) {
    if (url.match(/^data/)) {
        chrome.i18n.getMessage('unsupportedUrl');
        return;
    }

    if (url.match(/^ftp/)) {
        chrome.i18n.getMessage('unableToScanFTP');
        return;
    }

    if (url.match(/^file/)) {
        chrome.i18n.getMessage('unableToScanFileProtocol');
        return;
    }

    if (!url.match(/^http/)) {
        url = 'http://' + url;
    }

    return fetch(url, { method: 'HEAD' })
        .then(resp => {
            if ([0, 403, 404, 500, 503].indexOf(resp.status) >= 0) {
                chrome.i18n.getMessage('errorWhileDownloading');
                return;
            }

            if (!filename) {
                const respUrl = resp.url;
                filename = respUrl.substr(respUrl.lastIndexOf('/') + 1);
            }

            return resp.headers.get('content-length');
        });
}

async function getFileData(url) {
    return fetch(url).then(data => Promise.resolve(new Uint8Array(data.body)));
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

function getMd5Hash(fileData) {
    let spark = new SparkMD5.ArrayBuffer();
    spark.append(fileData);
    return spark.end().toUpperCase();
}