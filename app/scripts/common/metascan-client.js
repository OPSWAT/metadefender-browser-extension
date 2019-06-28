'use strict';

import 'chromereload/devonly';
import { SANITIZATION } from '../constants/workflows';
import browserMessage from '../common/browser/browser-message';
import { BROWSER_EVENT } from '../common/browser/browser-message-event';

import xhr from 'xhr';

/**
 *
 * @type {{configure: configure, setAuth: setAuth, setHost: setHost, setVersion: setVersion, hash: {lookup: hashLookup}, file: {upload: fileUpload, lookup: fileLookup, poolForResults: poolForResults}, apikey: {info: apikeyInfo}}}
 */
const MetascanClient = {
    configure: configure,
    setAuth: setAuth,
    setHost: setHost,
    setVersion: setVersion,

    // endpoints
    hash: {
        lookup: hashLookup
    },
    file: {
        upload: fileUpload,
        lookup: fileLookup,
        poolForResults: poolForResults
    },
    apikey: {
        info: apikeyInfo
    }
};

export default MetascanClient;

MetascanClient.ERROR_CODE = {
    HASH_NOT_FOUND: 404003
};

const config = {
    restApikey: null,
    restHost: null,
    restVersion: null,
    restEndpoint: null,
    pollingIncrementor: 1,
    pollingMaxInterval: 10000
};

const authHeader = {
    'apikey': null
};

function configure(conf){
    for (let c in conf) {
        if (Object.prototype.hasOwnProperty.call(config, c)) {
            config[c] = conf[c];
        }
    }

    setAuth(config.restApikey);

    return this;
}

/**
 *
 * @param apikey
 * @returns {setAuth}
 */
function setAuth(apikey) {
    authHeader['apikey'] = apikey;
    return this;
}

/**
 *
 * @param host
 * @returns {setHost}
 */
function setHost(host) {
    config.restHost = host;
    config.restEndpoint = `${config.restHost}/${config.restVersion}`;
    return this;
}

/**
 *
 * @param version
 * @returns {setVersion}
 */
function setVersion(version) {
    config.restVersion = version;
    config.restEndpoint = `${config.restHost}/${config.restVersion}`;
    return this;
}

/**
 * https://api.metadefender.com/v4/apikey
 *
 * @param {string} apikey
 */
function apikeyInfo(apikey){
    return new Promise((resolve, reject) => {
        let restEndpoint = `${config.restEndpoint}/apikey/${apikey}`;
        let options = {
            headers: Object.assign({}, authHeader, {
                'apikey': apikey
            })
        };

        xhr.get(restEndpoint, options, (err, resp, body) => {
            if (err) {
                reject(err);
            }

            try {
                resolve(JSON.parse(body));
            }
            catch (e) {
                reject(e);
            }
        });
    });
}

/**
 * https://api.metadefender.com/v4/hash/22946d910241d292f7b8c184f3ff7d0a
 *
 * @param {string} hash
 * @returns {Promise}
 */
function hashLookup(hash) {
    return new Promise((resolve, reject) => {
        let restEndpoint = `${config.restEndpoint}/hash/${hash}`;
        let options = {
            headers: authHeader
        };

        xhr.get(restEndpoint, options, (err, resp, body) => {
            if (err) {
                reject(err);
            }

            try {
                resolve(JSON.parse(body));
            }
            catch (e) {
                reject(e);
            }
        });
    });
}

/**
 * https://api.metadefender.com/v4//file
 *
 * @param {string} fileName
 * @param {any} fileData
 * @param {number} sampleSharing
 * @param {string} password
 * @returns {Promise}
 */
function fileUpload({fileName, fileData, sampleSharing, password, canBeSanitized}) {
    sampleSharing = (sampleSharing === true) ? 1 : 0;

    return new Promise((resolve, reject) => {
        let restEndpoint = `${config.restEndpoint}/file`;
        const additionalHeaders = {
            'Content-Type': 'application/octet-stream',
            'samplesharing': sampleSharing,
            'filename': fileName,
            'x-source': 'chrome_extension'
        };

        if (password) {
            additionalHeaders.archivepwd = password;
        }

        if (canBeSanitized) {
            additionalHeaders.rule = SANITIZATION;
        }

        let options = {
            headers: Object.assign({}, authHeader, additionalHeaders),
            body: fileData
        };
        xhr.post(restEndpoint, options, (err, resp, body) => {
            if (err) {
                reject(err);
            }

            resolve(JSON.parse(body));
        });
    });
}

/**
 * https://api.metadefender.com/v4/file/bzE3MDQyN0hrc01FRUhreWJCSnNXUWN4X3FLYg
 *
 * @param {string} dataId
 * @returns {Promise}
 */
function fileLookup(dataId) {
    return new Promise((resolve, reject) => {
        let restEndpoint = `${config.restEndpoint}/file/${dataId}`;
        let options = {
            headers: Object.assign({}, authHeader, {
                'x-file-metadata': 1
            })
        };

        xhr.get(restEndpoint, options, (err, resp, body) => {
            if (err) {
                reject(err);
            }

            resolve(JSON.parse(body));
        });
    });
}

/**
 *
 * @param {string} dataId
 * @param {number} pollingInterval
 * @returns {Promise}
 */
async function poolForResults(dataId, pollingInterval) {
    return new Promise((resolve) => {
        recursiveLookup(dataId, pollingInterval, resolve);
    });
}

/**
 *
 * @param dataId
 * @param pollingInterval
 * @param resolve
 * @returns {Promise.<void>}
 */
async function recursiveLookup(dataId, pollingInterval, resolve) {
    let response = await fileLookup(dataId);

    if (response.error) {
        return;
    }

    if (response.sanitized && Object.prototype.hasOwnProperty.call(response.sanitized, 'file_path')) {
        browserMessage.send({ event: BROWSER_EVENT.SANITIZED_FILE_READY, data: {
            dataId,
            sanitized: response.sanitized
        } });
    }

    pollingInterval = Math.min(pollingInterval * config.pollingIncrementor, config.pollingMaxInterval);

    if (response && response.scan_results && response.scan_results.progress_percentage < 100) {
        setTimeout(() => { recursiveLookup(dataId, pollingInterval, resolve); }, pollingInterval);
    }
    else {
        resolve(response);
    }
}
