'use strict';

import MCL from '../../../config/config';
import { SCAN_STATUS } from '../../constants/file';
import BrowserStorage from './../browser/browser-storage';

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
async function init() {
    const data = await BrowserStorage.get(MCL.config.storageKey.scanHistory);

    if (Object.keys(data).length === 0) {
        return this.save();
    }

    this.merge(data);
}

/**
 *
 * @param newData
 */
function merge(newData) {
    const objectToIterate = newData.hasOwnProperty('scanHistory') ? newData.scanHistory : newData;

    for (let key in objectToIterate) {
        if (Object.prototype.hasOwnProperty.call(objectToIterate, key) === true) {
            this[key] = objectToIterate[key];
        }
    }
}

/**
 * Save scan history to local storage
 * @returns {Promise.<void>}
 */
async function save() {
    const ids = this.files.map(({ id }) => id);

    await BrowserStorage.set({
        [MCL.config.storageKey.scanHistory]: {
            files: this.files.reduce((acc, val, index) => (ids.indexOf(val.id) === index ? [...acc, val] : acc), [])
        }
    });
}

async function cleanPendingFiles() {
    const nrOfTotalFiles = this.files.length;
    this.files = this.files.filter(file => {
        return file.status !== SCAN_STATUS.VALUES.SCANNING;
    });

    if (nrOfTotalFiles > this.files.length) {
        await this.save();
    }
}

/**
 * Load scan history from browser storage
 * @returns {Promise.<void>}
 */
async function load() {
    const data = await BrowserStorage.get(MCL.config.storageKey.scanHistory);
    this.merge(data);

    return data;
}

/**
 * Add a file to scan history
 * @param file
 * @returns {Promise<void>}
 */
async function addFile(file) {
    this.files.unshift(file);
    await this.save();
}

async function updateFileByDataId(dataId, data) {
    await this.load();
    const files = this.files;
    const fileIndex = files.findIndex(file => file.dataId === dataId);

    if (fileIndex === -1) {
        return;
    }

    const updatedFile = { ...files[fileIndex], ...data };
    files[fileIndex] = updatedFile;
    await this.save();
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
    await this.save();
}
