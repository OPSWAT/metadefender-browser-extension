'use strict';

import MCL from '../../../config/config';
import BrowserStorage from './../browser/browser-storage';

const storageKey = MCL.config.storageKey.settings;

/**
 *
 * @returns {{scanDownloads: boolean, shareResults: boolean, showNotifications: boolean, saveCleanFiles: boolean, init: init, merge: merge, save: save, load: load}}
 * @constructor
 */
function Settings() {
    return {
        id: Math.random(),
        data: {
            scanDownloads: false,
            shareResults: true,
            showNotifications: true,
            saveCleanFiles: false,
            safeUrl: false,
            useCore: false,
            coreV4: false,
            coreUrl: '',
            coreApikey: '',
            coreRule: '',
            rules: [],
        },

        // methods
        init,
        merge,
        save,
        load,
        get,
    };
};

export const settings = Settings();

/**
 *
 * @returns {Promise.<*>}
 */
async function init() {
    const { [storageKey]: settingsData } = await BrowserStorage.get(storageKey);
    if (!settingsData) {
        return await this.save();
    }

    this.merge(settingsData || {});
}

/**
 *
 * @returns {Promise.<void>}
 */
async function load() {
    const { [storageKey]: settingsData } = await BrowserStorage.get(storageKey);
    this.merge(settingsData);

    return this.data;
}

function merge(newData) {
    const settingKeys = Object.keys(this.data);
    for (const key in newData) {
        if (Object.prototype.hasOwnProperty.call(newData, key)) {
            if (settingKeys.includes(key)) {
                this.data[key] = newData[key];
            }
            else {
                console.warn(`Can't store ${key} in settings`);
            }
        }
    }
}

/**
 *
 * @returns {Promise.<void>}
 */
async function save() {
    return await BrowserStorage.set({ [storageKey]: this.data });
}

function get() {
    return this.data;
}
