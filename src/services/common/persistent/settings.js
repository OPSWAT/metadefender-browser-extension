'use strict';

import MCL from '../../../config/config';
import BrowserStorage from './../browser/browser-storage';

/**
 *
 * @returns {{scanDownloads: boolean, shareResults: boolean, showNotifications: boolean, saveCleanFiles: boolean, init: init, merge: merge, save: save, load: load}}
 * @constructor
 */
function Settings() {

    return {
        scanDownloads: true,
        shareResults: true,
        showNotifications: true,
        saveCleanFiles: false,
        safeUrl: false,
        useCore: false,
        coreV4: false,
        coreUrl: '',
        coreApikey: '',
        coreRule: '',

        // methods
        init: init,
        merge: merge,
        save: save,
        load: load,

        
    };
};

export const settings = Settings();

/**
 *
 * @returns {Promise.<*>}
 */
async function init() {
    const data = await BrowserStorage.get(MCL.config.storageKey.settings);

    if (Object.keys(data).length === 0) {
        return this.save();
    }

    this.merge(data.settings);
}

function merge(newData) {
    for (let key in newData) {
        if (Object.prototype.hasOwnProperty.call(newData, key) === true) {
            this[key] = newData[key];
        }
    }
}

/**
 *
 * @returns {Promise.<void>}
 */
async function save() {
    const settingKeys = ['scanDownloads', 'shareResults', 'showNotifications', 'saveCleanFiles', 'safeUrl', 'useCore', 'coreV4', 'coreUrl', 'coreApikey', 'coreRule'];
    const data = {};
    try {
        for (const key of settingKeys) {
            data[key] = this[key];
        }
    }
    catch (error) {
        console.error(error);
    }

    return await BrowserStorage.set({ [MCL.config.storageKey.settings]: data });
}

/**
 *
 * @returns {Promise.<void>}
 */
async function load() {
    const data = await BrowserStorage.get(MCL.config.storageKey.settings);
    this.merge(data);

    return data;
}
