'use strict';

import 'chromereload/devonly';

import { BROWSER_EVENT } from '../browser/browser-message-event';

import BrowserStorage from './../browser/browser-storage';
import BrowserMessage from './../browser/browser-message';

/**
 *
 * @returns {{scanDownloads: boolean, shareResults: boolean, showNotifications: boolean, saveCleanFiles: boolean, init: init, merge: merge, save: save, load: load}}
 * @constructor
 */
const Settings = {
    scanDownloads: true,
    shareResults: true,
    showNotifications: true,
    saveCleanFiles: false,
    safeUrl: false,
    useCore: false,
    coreUrl: '',
    corev4: false,
    coreApikey: '',
    coreRule: '',

    // methods
    init: init,
    merge: merge,
    save: save,
    load: load,
};

export const settings = Settings;

/**
 *
 * @returns {Promise.<*>}
 */
async function init(){
    let data = await BrowserStorage.get(MCL.config.storageKey.settings);
    
    if (typeof data === 'undefined') {
        return await this.save();
    }

    this.merge(data);
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
async function save(){
    const settingKeys = ['scanDownloads', 'shareResults', 'showNotifications', 'saveCleanFiles', 'safeUrl', 'useCore', 'corev4', 'coreUrl', 'coreApikey', 'coreRule'];
    const data = {};
    for (const key of settingKeys) {
        data[key] = this[key];
    }
    await BrowserStorage.set({[MCL.config.storageKey.settings]: data});
    await BrowserMessage.send({event: BROWSER_EVENT.SETTINGS_UPDATED});
}

/**
 *
 * @returns {Promise.<void>}
 */
async function load(){
    let data = await BrowserStorage.get(MCL.config.storageKey.settings);
    this.merge(data);
}