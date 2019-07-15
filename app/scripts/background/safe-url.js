import '../common/config';

/**
 * A list of urls that are currently redirecting.
 */
const activeRedirects = new Set();

/**
 * Intercept web request before the request is made
 * and redirect valid urls to safe-redirect endpoint.
 * 
 * @param {string} safeRedirectEndpoint 
 * @param {*} details chrome.webRequest event details
 * @returns a BlockingResponse https://developer.chrome.com/extensions/webRequest
 */
const safeRedirect = (details) => {
    const safeRedirectEndpoint = `${MCL.config.mclDomain}/safe-redirect/`;

    if (details.tabId > 0 && details.type === 'main_frame' && details.url) {
        
        const tabUrl = details.url;
        if (tabUrl.startsWith('http') && !tabUrl.startsWith(safeRedirectEndpoint)) {

            if (!activeRedirects[tabUrl]) {

                const safeUrl = safeRedirectEndpoint + encodeURIComponent(tabUrl);
                activeRedirects[tabUrl] = 1;
                return {redirectUrl: safeUrl};
            }
            delete activeRedirects[tabUrl];
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

        this._safeRedirect = safeRedirect;
    }

    toggle(enable) {
        if (this.enabled === enable) { 
            return; 
        }

        this.enabled = enable;
        if (this.enabled) {
            chrome.webRequest.onBeforeRequest.addListener(
                safeRedirect, 
                {urls: ['<all_urls>']}, 
                ['blocking']
            );
        }
        else {
            chrome.webRequest.onBeforeRequest.removeListener(
                safeRedirect
            );
        }

        return this.enabled;
    }
}

export default new SafeUrl();