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
    const removedFiles = await BrowserStorage.get(MCL.config.storageKey.scanHistory)?.scanHistory?.removedFiles || [];
    const ids = this.files.map(({ id }) => id)?.filter((id) => !removedFiles.includes(id));
    console.log('this.files', this.files);
    console.log('removedfiles', removedFiles);
    
    await BrowserStorage.set({
        [MCL.config.storageKey.scanHistory]: {
            files: this.files.reduce((acc, val, index) => (ids.indexOf(val.id) === index ? [...acc, val] : acc), []),
            removedFiles: [...removedFiles]
            
        }
    });
}

async function cleanPendingFiles() {
    const files = await BrowserStorage.get(MCL.config.storageKey.scanHistory);
    const allFiles = files?.scanHistory?.files || [];
    const nrOfTotalFiles = allFiles?.length;
    const removedFiles = files?.scanHistory?.removedFiles || [];
    const updatedFiles = allFiles?.filter(file => {
        return file.status !== SCAN_STATUS.VALUES.SCANNING;
    });
    this.files = updatedFiles;
    console.log('updatedFiles', updatedFiles);

    if (nrOfTotalFiles > updatedFiles?.length) {
        await BrowserStorage.set({
            [MCL.config.storageKey.scanHistory]: {
                files: updatedFiles,
                removedFiles: [...removedFiles]
            }
        });
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
    const files = await BrowserStorage.get(MCL.config.storageKey.scanHistory);
    const allFiles = files?.scanHistory?.files || [];
    const removedFiles = files?.scanHistory?.removedFiles || [];
    
    allFiles?.unshift(file);
    this.files = allFiles
    await BrowserStorage.set({
        [MCL.config.storageKey.scanHistory]: {
            files: allFiles,
            removedFiles: [...removedFiles]
        }
    });
}

async function updateFileByDataId(dataId, data) {
    const files = await BrowserStorage.get(MCL.config.storageKey.scanHistory);;
    const scanHistoryFiles = files?.scanHistory?.files || [];
    const removedFiles = files?.scanHistory?.removedFiles || [];
    await this.load();
    const fileIndex = scanHistoryFiles?.findIndex(file => file?.dataId === dataId);

    if (fileIndex === -1) {
        return;
    }

    const updatedFile = { ...scanHistoryFiles[fileIndex], ...data };
    scanHistoryFiles[fileIndex] = updatedFile;
    await BrowserStorage.set({
        [MCL.config.storageKey.scanHistory]: {
            files: scanHistoryFiles,
            removedFiles: [...removedFiles]
            
        }
    });
}

/**
 * Remove a file from scan history
 * @param file
 * @returns {Promise<void>}
 */

async function removeFile(id) {
    const files = await BrowserStorage.get(MCL.config.storageKey.scanHistory);
    console.log('files', files);
    const updatedFiles = files?.scanHistory?.files?.filter((file) => file.id !== id);
    const removedFiles = files?.scanHistory?.removedFiles || [];
    console.log('!!!removedFile', removedFiles);
    await BrowserStorage.set({
        [MCL.config.storageKey.scanHistory]: {
            files: updatedFiles,
            removedFiles: [...removedFiles, id]
        }
    });
    this.files = updatedFiles;
    await this.save();
}

/**
 * Remove all files from scan history
 * @returns {Promise<void>}
 */
async function clear() {
    await BrowserStorage.set({
        [MCL.config.storageKey.scanHistory]: {
            files: []
        }
    });    
}
