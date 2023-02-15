'use strict';

import { callAPI } from './callAPI';

/**
 *
 * @type {{configure: configure, setAuth: setAuth, hash: {lookup: hashLookup}, file: {upload: fileUpload, lookup: fileLookup, poolForResults: poolForResults}}}
 */
const CoreClient = {
    configure: configure,
    setAuth: setAuth,

    // endpoints
    file: {
        upload: fileUpload,
        lookup: fileLookup,
        poolForResults: poolForResults,
        checkSanitized: checkSanitized
    },
    hash: {
        lookup: hashLookup
    },
    version: getVersion,
    rules: getRules
};

export default CoreClient;

const config = {
    apikey: null,
    endpoint: null,
    pollingIncrementor: 1,
    pollingMaxInterval: 10000
};

const authHeader = {
    'apikey': null
};

/**
 * Overwrite default configuration.
 * 
 * @param {*} conf 
 */
function configure(conf) {
    for (let c in conf) {
        if (Object.prototype.hasOwnProperty.call(config, c)) {
            config[c] = conf[c];
        }
    }

    setAuth(config.apikey);
    return this;
}

/**
 * Set client authentication.
 * 
 * @param apikey
 * @returns {setAuth}
 */
function setAuth(apikey) {
    authHeader['apikey'] = apikey;
    return this;
}

/**
 * https://onlinehelp.opswat.com/corev4/8.1.3.1._Process_a_file.html
 *
 * @param {any} fileData file content
 * @param {string} fileName file name
 * @param {boolean} canBeSanitized a flag for sanitizable files
 * @param {string} rule core scan workflow
 * @returns {Promise}
 */
function fileUpload({ fileData, fileName, rule }) {
    const restEndpoint = `${config.endpoint}/file`;
    const httpHeaders = {
        'Content-Type': 'application/octet-stream',
        'user_agent': 'chrome_extension',
        'filename': fileName,
    };
    if (rule) {
        httpHeaders.rule = rule;
        httpHeaders.workflow = rule;
    }

    const options = {
        headers: { ...authHeader, ...httpHeaders },
        body: fileData
    };

    return callAPI(restEndpoint, options, 'post');
}

/**
 * https://onlinehelp.opswat.com/corev4/8.1.3.2._Fetch_processing_result.html
 *
 * @param {string} dataId
 * @returns {Promise}
 */
function fileLookup(dataId) {
    const restEndpoint = `${config.endpoint}/file/${dataId}`;
    const options = {
        headers: authHeader
    };

    return callAPI(restEndpoint, options);
}

/**
 * https://onlinehelp.opswat.com/corev4/8.1.3.2._Fetch_processing_result.html
 *
 * @param {string} hash md5|sha1|sha256
 * @returns {Promise}
 */
function hashLookup(hash) {
    const restEndpoint = `${config.endpoint}/hash/${hash}`;
    const options = {
        headers: authHeader
    };

    return callAPI(restEndpoint, options);
}

/**
 *
 * @param {string} dataId
 * @param {number} pollingInterval
 * @returns {Promise}
 */
function poolForResults(dataId, pollingInterval) {
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

/**
 * https://onlinehelp.opswat.com/corev4/8.1.8.2._Get_Product_Version.html
 * 
 * @returns {Promise} 
 */
function getVersion() {
    const restEndpoint = `${config.endpoint}/version`;
    const options = {
        headers: authHeader
    };

    return callAPI(restEndpoint, options);
}

/**
 * /file/rules
 */
function getRules() {
    const restEndpoint = `${config.endpoint}/file/rules`;
    const options = {
        headers: authHeader
    };

    return callAPI(restEndpoint, options);
}

/**
 * Check if the user has access to the URL.
 *
 * @param {string} downloadUrl 
 */
function checkSanitized(downloadUrl) {
    return fetch(downloadUrl).then(response => response.status === 200);
}
