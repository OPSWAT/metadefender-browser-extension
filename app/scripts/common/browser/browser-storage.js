'use strict';

/**
 * browser.local.storage extension
 * @type {{get: get, set: set, remove: remove, clear: clear}}
 */
const browserStorage = {
    get: get,
    set: set,
    remove: remove,
    clear: clear
};

export default browserStorage;

/**
 * Gets one or more items from storage.
 * @param keys string|[string, ...]|null. Passing null will retrive the entire storage contents
 * @returns {Promise}
 */
function get(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (data) => {
            if (typeof keys === 'string') {
                resolve(data[keys]);
            }
            else {
                resolve(data);
            }
        });
    });
}

/**
 * Sets multiple items.
 * @param items object
 * @returns {Promise}
 */
function set(items) {
    return new Promise((resolve) => {
        chrome.storage.local.set(items, () => { resolve(items); });
    });
}

/**
 * Removes one or more items from storage.
 * @param keys string|[string, ...]
 * @returns {Promise}
 */
function remove(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.remove(keys, () => { resolve(); });
    });
}

/**
 * Removes all items from storage.
 * @returns {Promise}
 */
function clear() {
    return new Promise((resolve) => {
        chrome.storage.local.clear(() => { resolve(); });
    });
}
