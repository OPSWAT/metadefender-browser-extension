import MCL from '../../config/config';
import { settings } from '../common/persistent/settings';
import { getDomain } from './download-manager';

/**
 * Metadefender Cloud Endpoint for url check
 */
const safeRedirectEndpoint = `${MCL.config.mclDomain}/safe-redirect/`;

/**
 * A list of urls that are currently redirecting.
 */
export const activeRedirects = new Set();

/**
 * A list of urls that are infected.
 */
export const infectedUrls = new Set();

/**
 * A list of urls that are not infected.
 * Used to speed-up navigation after fist check.
 */
export const cleanUrls = new Set();

/**
 * Removes old urls that were marked as clean
 */


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
        if (res.status === 400) {
            infectedUrls.add(testUrl);
        }
        else {
            cleanUrls.add(testUrl);
        }
    }
    catch (e) {
        cleanUrls.add(testUrl);
    }
};

export const isSafeUrl = async (testUrl, urlValidator) => {
    return fetch(urlValidator, { sync: true, headers: { noredirect: true } })
        .then(res => handleUrlValidatorResponse(testUrl, null, res))
        .catch(err => handleUrlValidatorResponse(testUrl, err, null));
};

/**
 * Intercept web request before the request is made
 * and redirect valid urls to safe-redirect endpoint.
 * 
 * @param {number} tabId chrome tab tabId
 * @param {object} changeInfo changed informations
 * @param {object} tab tab object 
 */
export const doSafeRedirect = async (tabId, changeInfo, tab) => {

    const tabUrl = tab.url;
    const domain = await getDomain(tabUrl);
    if (settings?.data?.useWhiteList === true && domain) {
        const whiteList = settings?.data?.whiteListCustom || [];
        const isWhitelisted = whiteList.some(allowedDomain => {
            if (allowedDomain.startsWith('*.')) {
                const baseDomain = allowedDomain.substring(2);
                return domain === baseDomain || domain.endsWith(`.${baseDomain}`);
            }
            return domain === allowedDomain;
        });

        if (isWhitelisted) {
            return;
        }
    }

    if (changeInfo.status === 'loading' && !tabUrl.startsWith(safeRedirectEndpoint)) {
        const shortUrl = tabUrl.split('?')[0];

        if (!activeRedirects.has(shortUrl)) {
            if (!cleanUrls.has(shortUrl)) {
                const safeUrl = safeRedirectEndpoint + encodeURIComponent(tabUrl);
                await isSafeUrl(shortUrl, safeUrl);
                if (infectedUrls.has(shortUrl)) {
                    activeRedirects.add(shortUrl);
                    chrome.tabs.update(tabId, { url: safeUrl });
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
    }

    async init() {
        const settingsData = await settings.load();
        this.toggle(settingsData.safeUrl);
    }

    toggle(enable) {
        if (this.enabled === enable) {
            return;
        }

        this.enabled = enable;

        if (this.enabled) {
            chrome.tabs.onUpdated.addListener(doSafeRedirect);
        } else {
            chrome.tabs.onUpdated.removeListener(doSafeRedirect);
        }

        return this.enabled;
    }
}

export default new SafeUrl();
