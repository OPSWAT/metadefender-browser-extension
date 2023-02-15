/**
 * browser.notifications extension
 *
 * @type {{create: create}}
 */
 const browserTranslate = {
    getMessage: getMessage
};

export default browserTranslate;

/**
 *
 * @param message
 */
function getMessage(key, replace) {
    let msg = chrome.i18n.getMessage(key);

    if (typeof replace !== 'undefined') {
        let t, re, tokens = Object.keys(replace);
        for (t of tokens) {
            re = new RegExp(t, 'g');
            msg = msg.replace(re, replace[t]);
        }
    }

    return msg;
}
