'use strict';

import 'chromereload/devonly';

import { BROWSER_EVENT } from '../browser/browser-message-event';
import { SCAN_STATUS } from '../../constants/file';

import BrowserStorage from './../browser/browser-storage';
import BrowserMessage from './../browser/browser-message';

/**
 *
 * @param browserStorage
 * @param browserMessage
 * @returns {{files: Array, init: init, save: save, load: load, merge: merge, addFile: addFile, removeFile: removeFile, clear: clear}}
 * @constructor
 */
function ScanHistory() {

    return {
        files: [],

        // methods
        init,
        save,
        cleanPendingFiles,
        load,
        merge,
        addFile,
        updateFileByDataId,
        removeFile,
        clear
    };
}

export const scanHistory = ScanHistory();

/**
 *
 * @returns {Promise.<*>}
 */
async function init(){
    let data = await BrowserStorage.get(MCL.config.storageKey.scanHistory);

    if (typeof data === 'undefined') {
        return await this.save();
    }

    this.merge(data);
}

/**
 *
 * @param newData
 */
function merge(newData) {
    for (let key in newData) {
        if (Object.prototype.hasOwnProperty.call(newData, key) === true) {
            this[key] = newData[key];
        }
    }
}

/**
 * Save scan history to local storage
 * @returns {Promise.<void>}
 */
async function save(){
    await BrowserStorage.set({[MCL.config.storageKey.scanHistory]: {
        files: this.files
    }});
    BrowserMessage.send({event: BROWSER_EVENT.SCAN_FILES_UPDATED});
}

async function cleanPendingFiles() {
    const nrOfTotalFiles = this.files.length;
    this.files = this.files.filter(file => {
        return file.status !== SCAN_STATUS.SCANNING;
    });

    if (nrOfTotalFiles > this.files.length) {
        await this.save();
    }
}

/**
 * Load scan history from browser storage
 * @returns {Promise.<void>}
 */
async function load(){
    let data = await BrowserStorage.get(MCL.config.storageKey.scanHistory);
    this.merge(data);
}

/**
 * Add a file to scan history
 * @param file
 * @returns {Promise<void>}
 */
async function addFile(file) {
    this.files.unshift(file);
    this.save();
}

async function updateFileByDataId(dataId, data) {
    await this.load();
    const files = this.files;
    const fileIndex = files.findIndex(file => {
        return file.dataId === dataId;
    });

    if (fileIndex === -1) {
        return;
    }

    const updatedFile = Object.assign({}, files[fileIndex], data);
    files[fileIndex] = updatedFile;
    await this.save();
}

/**
 * Remove a file from scan history
 * @param file
 * @returns {Promise<void>}
 */
async function removeFile(file) {
    this.files.splice(this.files.indexOf(file), 1);
    this.save();
}

/**
 * Remove all files from scan history
 * @returns {Promise<void>}
 */
async function clear() {
    this.files = [];
    this.save();
}
