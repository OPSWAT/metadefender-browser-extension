import moment from 'moment';
import xhr from 'xhr';
import uniqid from 'uniqid';
import SparkMD5 from 'spark-md5';
import {SCAN_STATUS} from '../constants/file';

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
        dataId: null
    };
}

export default ScanFile;

// methods
ScanFile.getScanStatus = getScanStatus;
ScanFile.getScanStatusLabel = getScanStatusLabel;
ScanFile.download = download;
ScanFile.isSanitizedFile = isSanitizedFile;
ScanFile.getFileSize = getFileSize;
ScanFile.getFileData = getFileData;
ScanFile.getMd5Hash = getMd5Hash;

// const
ScanFile.STATUS = SCAN_STATUS.VALUES;

ScanFile.STATUS_VALUES_CLEAN = SCAN_STATUS.CLEAN_VALUES;
ScanFile.STATUS_VALUES_INFECTED = SCAN_STATUS.INFECTED_VALUES;

const URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

async function download(link, fileData, fileName) {

    let fileUrl;

    try {
        fileUrl = URL.createObjectURL(new Blob([fileData]));
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

function isSanitizedFile(url) {
    const urlLow = url.toLowerCase();

    for (let bucket of MCL.config.sanitizationBuckets) {
        if (urlLow.indexOf(bucket) > -1 ) {
            return true;
        }
    }
}

function getFileSize(url, filename){
    return new Promise((resolve, reject) => {
        if (url.match(/^data/)) {
            reject(chrome.i18n.getMessage('unsupportedUrl'));
        }

        if (url.match(/^ftp/)) {
            reject(chrome.i18n.getMessage('unableToScanFTP'));
        }

        if (url.match(/^file/)) {
            reject(chrome.i18n.getMessage('unableToScanFileProtocol'));
        }

        if (!url.match(/^http/)) {
            url = 'http://' + url;
        }

        xhr.head(url, (err, resp) => {
            if (err) {
                reject(err);
            }

            if ([0, 403, 404, 500, 503].indexOf(resp.statusCode) >= 0) {
                reject(chrome.i18n.getMessage('errorWhileDownloading'));
            }

            if (!filename) {
                let url = resp.url;
                filename = url.substr(url.lastIndexOf('/') + 1);
            }

            let fileSize = resp.headers['content-length'];
            resolve(fileSize);
        });
    });
}

async function getFileData(url){
    return new Promise((resolve, reject) => {
        try {
            xhr.get(url, {
                responseType: 'arraybuffer'
            }, (err, resp, body) => {
                if (err) {
                    reject(err);
                }

                if (body) {
                    var byteArray = new Uint8Array(body);
                    resolve(byteArray);
                }
            });
        }
        catch (e) {
            reject(e);
        }
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
    return chrome.i18n.getMessage('scanResult'+status);
}

function getMd5Hash(fileData) {
    let spark = new SparkMD5.ArrayBuffer();
    spark.append(fileData);
    return spark.end().toUpperCase();
}