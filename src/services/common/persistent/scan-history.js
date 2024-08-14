'use strict';

import MCL from '../../../config/config';
import { SCAN_STATUS } from '../../constants/file';
import BrowserStorage from './../browser/browser-storage';

const storageKey = MCL.config.storageKey.scanHistory;

/**
 *
 * @returns {{files: Array, init: init, save: save, load: load, merge: merge, addFile: addFile, removeFile: removeFile, clear: clear}}
 * @constructor
 */
function ScanHistory() {
    return {
        files: [],

        // methods
        init,
        load,
        save,
        merge,
        cleanPendingFiles,
        updateFileById,
        updateFileByDataId,
        addFile,
        removeFile,
        clear
    };
}

export const scanHistory = ScanHistory();

/**
 *
 * @returns {Promise.<*>}
 */
async function init() {

    const { [storageKey]: historyData } = await BrowserStorage.get(storageKey);
    if (!historyData) {
        return this.save();
    }

    this.merge(historyData);
}

/**
 * Load scan history from browser storage
 * @returns {Promise} { files: [] }
 */
async function load() {
    const { [storageKey]: historyData } = await BrowserStorage.get(storageKey);
    this.merge(historyData);

    return historyData;
}

/**
 *
 * @param newData
 */
function merge(newData) {
    for (let key in newData) {
        if (Object.prototype.hasOwnProperty.call(newData, key)) {
            this[key] = newData[key];
        }
    }
}

/**
 * Save scan history to local storage
 * @returns {Promise.<void>}
 */
async function save() {
    await BrowserStorage.set({
        [storageKey]: {
            files: this.files
        }
    });
}

async function cleanPendingFiles() {
    const nrOfTotalFiles = this.files.length;
    this.files = this.files.filter(file => {
        return file.status !== SCAN_STATUS.VALUES.SCANNING;
    });
    if (nrOfTotalFiles > this.files.length) {
        this.save();
    }
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

async function updateFileById(id, data) {
    const fileIndex = this.files.findIndex(file => file?.id === id);
    if (fileIndex === -1) {
        return;
    }
    this.files[fileIndex] = { ...this.files[fileIndex], ...data };
    this.save();
}

async function updateFileByDataId(dataId, data) {
    const fileIndex = this.files.findIndex(file => file?.dataId === dataId);
    if (fileIndex === -1) {
        return;
    }
    this.files[fileIndex] = { ...this.files[fileIndex], ...data };
    this.save();
}

/**
 * Remove a file from scan history
 * @param file
 * @returns {Promise<void>}
 */

async function removeFile(id) {
    this.files = this.files.filter((file) => file.id !== id);
    await this.save();
}

/**
 * Remove all files from scan history
 * @returns {Promise<void>}
 */
async function clear() {
    this.files = [];
    this.save();
}
