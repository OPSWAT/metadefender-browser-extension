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
function Settings() {

    return {
        scanDownloads: true,
        shareResults: true,
        showNotifications: true,
        saveCleanFiles: false,

        // methods
        init: init,
        merge: merge,
        save: save,
        load: load,
    };
}

export const settings = Settings();

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
    await BrowserStorage.set({[MCL.config.storageKey.settings]: {
        scanDownloads: this.scanDownloads,
        shareResults: this.shareResults,
        showNotifications: this.showNotifications,
        saveCleanFiles: this.saveCleanFiles
    }});
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