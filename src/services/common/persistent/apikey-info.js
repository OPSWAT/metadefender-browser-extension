'use strict';

import MCL from '../../../config/config';
import BrowserStorage from '../../common/browser/browser-storage';

const storageKey = MCL.config.storageKey.apikey;

/**
 *
 * @returns {{apikey: null, reputationLimit: null, preventionLimit: null, feedLimit: null, paidUser: null, limitInterval: string, loggedIn: boolean, init: init, save: save, load: load, parseMclInfo: parseMclInfo, merge: merge}}
 * @constructor
 */
function ApikeyInfo() {
    return {
        data: {
            apikey: null,
            reputationLimit: null,
            preventionLimit: null,
            feedLimit: null,
            paidUser: null,
            limitInterval: 'Daily',
            maxUploadFileSize: null,
            sandboxLimit: null,
            loggedIn: false,
            organization: null,
        },

        // methods
        init,
        save,
        load,
        parseMclInfo,
        merge,
    };
}

export const apikeyInfo = ApikeyInfo();

/**
 *
 * @returns {Promise.<*>}
 */
async function init() {
    const { [storageKey]: apikeyData } = await BrowserStorage.get(storageKey);
    if (!apikeyData) {
        return this.save();
    }

    this.merge(apikeyData);
}

function merge(newData) {
    for (let key in newData) {
        if (Object.prototype.hasOwnProperty.call(newData, key) === true) {
            this.data[key] = newData[key];
        }
    }
}

/**
 *
 * @returns {Promise.<*>}
 */
async function save() {
    await BrowserStorage.set({[storageKey]: this.data});
}

/**
 *
 * @param info
 */
function parseMclInfo(info) {
    this.data.reputationLimit = info.limit_reputation;
    this.data.preventionLimit = info.limit_prevention;
    this.data.feedLimit = info.limit_feed;
    this.data.paidUser = info.paid_user;
    this.data.limitInterval = info.time_interval;
    this.data.maxUploadFileSize = info.max_upload_file_size;
    this.data.sandboxLimit = info.limit_sandbox;
    this.data.organization = info.organization || null;
}

/**
 *
 * @returns {Promise.<void>}
 */
async function load() {
    const { [storageKey]: apikeyData } = await BrowserStorage.get(storageKey);
    this.merge(apikeyData);

    return apikeyData;
}
