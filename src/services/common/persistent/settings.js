'use strict';

import MCL from '../../../config/config';
import BrowserStorage from './../browser/browser-storage';

const storageKey = MCL.config.storageKey?.settings;

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
            useCustomApiKey: false,
            coreV4: false,
            coreUrl: '',
            coreApikey: '',
            apikeyCustom: '',
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
}

export const settings = Settings();

/**
 *
 * @returns {Promise.<*>}
 */
async function init() {
    const storageValue = await BrowserStorage.get(storageKey);
    if (!storageValue) {
        return;
    }

    const { [storageKey]: settingsData } = storageValue;
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
    const result = await BrowserStorage.get(storageKey);

    if (!result || !(storageKey in result)) {
        return null;
    }

    const { [storageKey]: apikeyData } = result;
    this.merge(apikeyData);

    return apikeyData;
}

function merge(newData) {
    const settingKeys = Object.keys(this.data);
    for (const key in newData) {
        if (Object.prototype.hasOwnProperty.call(newData, key)) {
            if (settingKeys.includes(key)) {
                this.data[key] = newData[key];
            } else {
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
