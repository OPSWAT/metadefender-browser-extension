'use strict';

import { SANITIZATION, UNARCHIVE } from '../constants/workflow';
import MCL from '../../config/config';

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
    domain: {
        lookup: domainLookup
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

function configure(conf) {
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
 * @returns {MetascanClient}
 */
function setAuth(apikey) {
    authHeader['apikey'] = apikey;
    return this;
}

/**
 *
 * @param host
 * @returns {MetascanClient}
 */
function setHost(host) {
    config.restHost = host;
    config.restEndpoint = `${config.restHost}/${config.restVersion}`;
    return this;
}

/**
 *
 * @param version
 * @returns {MetascanClient}
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
 * @returns {Promise}
 */
function apikeyInfo(apikey) {
    const restEndpoint = `${MCL.config.metadefenderDomain}/${MCL.config.metadefenderVersion}/apikey`;
    const options = {
        headers: {
            ...authHeader,
            'apikey': apikey
        }
    };

    return fetch(restEndpoint, options).then(data => data.json());
}

/**
 * https://api.metadefender.com/v4/hash/22946d910241d292f7b8c184f3ff7d0a
 *
 * @param {string} hash
 * @returns {Promise}
 */
function hashLookup(hash) {
    const restEndpoint = `${MCL.config.metadefenderDomain}/${MCL.config.metadefenderVersion}/hash/${hash}`;
    const options = {
        headers: authHeader
    };
    
    return fetch(restEndpoint, options).then(response => response.json()).catch(error => {
        console.warn(error);
        return { error };
    });
}

/**
 * https://api.metadefender.com/v4//file
 *
 * @param {string} fileName
 * @param {any} fileData
 * @param {boolean} sampleSharing
 * @param {string} password
 * @param {boolean} canBeSanitized
 * @returns {Promise}
 */
function fileUpload({ fileName, fileData, sampleSharing, password, canBeSanitized }) {
    sampleSharing = (sampleSharing === true) ? 1 : 0;

    const restEndpoint = `${MCL.config.metadefenderDomain}/${MCL.config.metadefenderVersion}/file`;
    const additionalHeaders = {
        'Content-Type': 'application/octet-stream',
        'samplesharing': sampleSharing,
        'filename': fileName,
        'rule': UNARCHIVE,
        'x-source': 'chrome_extension'
    };

    if (password) {
        additionalHeaders.archivepwd = password;
    }

    if (canBeSanitized) {
        additionalHeaders.rule += ',' + SANITIZATION;
    }

    const options = {
        method: 'POST',
        headers: { ...authHeader, ...additionalHeaders },
        body: fileData
    };

    return fetch(restEndpoint, options).then(response => response.json()).catch(error => {
        console.warn(error);
        return { error };
    });
}

/**
 * https://api.metadefender.com/v4/file/bzE3MDQyN0hrc01FRUhreWJCSnNXUWN4X3FLYg
 *
 * @param {string} dataId
 * @returns {Promise}
 */
function fileLookup(dataId) {
    const restEndpoint = `${MCL.config.metadefenderDomain}/${MCL.config.metadefenderVersion}/file/${dataId}`;
    const options = {
        headers: { ...authHeader, 'x-file-metadata': 1 }
    };

    return fetch(restEndpoint, options).then(data => data.json());
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
    const response = await fileLookup(dataId);

    if (response.error) {
        return;
    }

    pollingInterval = Math.min(pollingInterval * config.pollingIncrementor, config.pollingMaxInterval);

    if (response?.scan_results?.progress_percentage < 100) {
        setTimeout(() => { recursiveLookup(dataId, pollingInterval, resolve); }, pollingInterval);
    }
    else {
        resolve(response);
    }
}

async function domainLookup() {
    
}