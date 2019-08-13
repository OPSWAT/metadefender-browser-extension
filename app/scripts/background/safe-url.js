import '../common/config';

import xhr from 'xhr';

/**
 * Metadefender Cloud Endpoint for url check
 */
const safeRedirectEndpoint = `${MCL.config.mclDomain}/safe-redirect/`;

/**
 * A list of urls that are currently redirecting.
 */
const activeRedirects = new Set();

/**
 * A list of urls that are infected.
 */
const infectedUrls = new Set();

/**
 * A list of urls that are not infected.
 * Used to speed-up navigation after fist check.
 */
const cleanUrls = new Set();

/**
 * Removes old urls that were marked as clean
 */
const removeOldUrls = () => {
    if (cleanUrls.size > MCL.config.maxCleanUrls) {
        const firstValue = cleanUrls.values().next().value;
        cleanUrls.delete(firstValue);
    }
};

/**
 * Save the url as infected or not.
 * @param {string} testUrl the url to be tested
 * @param {string} urlValidator test endpoint
 */
const handleUrlValidatorResponse = (testUrl, err, res) => {
    if (err) {
        cleanUrls.add(testUrl);
        return;
    }

    try {
        if (res.headers.status === '400') {
            infectedUrls.add(testUrl);
        }
        else {
            cleanUrls.add(testUrl);
        }
    }
    catch (e) {
        cleanUrls.add(testUrl);
    }
    removeOldUrls();
};

const isSafeUrl = (testUrl, urlValidator) => {
    xhr.get(urlValidator, {sync: true, headers: {noredirect: true}}, (err, res) => handleUrlValidatorResponse(testUrl, err, res));
};

/**
 * Intercept web request before the request is made
 * and redirect valid urls to safe-redirect endpoint.
 * 
 * @param {string} safeRedirectEndpoint 
 * @param {*} details chrome.webRequest event details
 * @returns a BlockingResponse https://developer.chrome.com/extensions/webRequest
 */
const doSafeRedirect = (details) => {
    const tabUrl = details.url || '';

    if (!tabUrl.startsWith(safeRedirectEndpoint)) {
        const shortUrl = tabUrl.split('?')[0];
        if (!activeRedirects.has(shortUrl) && details.initiator !== 'null') {
            if (!cleanUrls.has(shortUrl)) {
                const safeUrl = safeRedirectEndpoint + encodeURIComponent(tabUrl);
                isSafeUrl(shortUrl, safeUrl);
                if (infectedUrls.has(shortUrl)) {
                    activeRedirects.add(shortUrl);
                    return {
                        redirectUrl: safeUrl
                    };
                }
            }
        }
        activeRedirects.delete(shortUrl);
        if (infectedUrls.has(shortUrl)) {
            infectedUrls.delete(shortUrl);
        }
    }
};

/**
 * Verifies urls using metadefender cloud safe-redirect feature.
 */
class SafeUrl {
    constructor() {
        this.enabled = false;
        this.toggle = this.toggle.bind(this);

        this._infectedUrls = infectedUrls;
        this._cleanUrls = cleanUrls;
        this._doSafeRedirect = doSafeRedirect;
        this._handleUrlValidatorResponse = handleUrlValidatorResponse;
    }

    toggle(enable) {
        if (this.enabled === enable) { 
            return; 
        }

        this.enabled = enable;
        if (this.enabled) {
            chrome.webRequest.onBeforeRequest.addListener(doSafeRedirect, {
                urls: ['http://*/*', 'https://*/*'], 
                types: ['main_frame']
            }, ['blocking']);
        }
        else {
            chrome.webRequest.onBeforeRequest.removeListener(doSafeRedirect);
        }

        return this.enabled;
    }
}

export default new SafeUrl();