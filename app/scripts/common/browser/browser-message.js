'use strict';

import 'chromereload/devonly';

const browserMessage = {
    send,
    addListener
};
export default browserMessage;

/**
 * Promisify chrome API: `runtime.sendMessage`.
 * 
 * @link https://developer.chrome.com/apps/runtime#method-sendMessage
 * 
 * @param {*} data
 * @param {*} options
 * @returns {Promise}
 */
function send(data, options) {
    return new Promise((resolve) => {
        return chrome.runtime.sendMessage(data, options, (response) => {
            if (!chrome.runtime.lastError) {
                resolve(response);
            }
        });
    });
}

/**
 *
 */
function addListener(listener) {
    chrome.runtime.onMessage.addListener(listener);
}
