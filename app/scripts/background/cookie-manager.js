import '../common/config';

class CookieManager {
    constructor() {
        if (!chrome.cookies) {
            chrome.cookies = chrome.experimental.cookies;
        }
    }

    onChange(callback) {
        chrome.cookies.onChanged.addListener(callback);
    }

    get(callback) {
        return chrome.cookies.get({
            url: MCL.config.mclDomain,
            name: MCL.config.authCookieName
        }, callback);
    }
}

export default new CookieManager();