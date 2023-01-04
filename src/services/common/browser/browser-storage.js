'use strict';

/**
 * browser.local.storage extension
 * @type {{get: get, set: set, remove: remove, clear: clear}}
 */
const browserStorage = {
    get: get,
    set: set,
    remove: remove,
    clear: clear,
    addListener: handleChangeListener,
    removeListener: removeChangeListenre
};

export default browserStorage;

/**
 * Gets one or more items from storage.
 * @param keys string|[string, ...]|null. Passing null will retrive the entire storage contents
 * @returns {Promise}
 */
function get(keys) {
    return chrome.storage.local.get(keys);
}

/**
 * Sets multiple items.
 * @param items object
 * @returns {Promise}
 */
function set(items) {
    return chrome.storage.local.set(items);
}

/**
 * Removes one or more items from storage.
 * @param keys string|[string, ...]
 * @returns {Promise}
 */
function remove(keys) {
    return chrome.storage.local.remove(keys);
}

/**
 * Removes all items from storage.
 * @returns {Promise}
 */
function clear() {
    return chrome.storage.local.clear();
}

function handleChangeListener(listener) {
    return chrome.storage.onChanged.addListener(listener);
}

function removeChangeListenre(listener) {
    return chrome.storage.onChanged.removeListener(listener);
}
