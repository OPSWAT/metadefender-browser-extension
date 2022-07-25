import MCL from '../../config/config';

class CookieManager {
    constructor() {
        if (!chrome.cookies) {
            chrome.cookies = chrome.experimental.cookies;
        }
    }

    onChange(callback) {
        chrome.cookies.onChanged.addListener(callback);
    }

    get() {
        return chrome.cookies.get({
            url: MCL.config.mclDomain,
            name: MCL.config.authCookieName
        });
    }
}
const cookieManager = new CookieManager;

export default cookieManager;