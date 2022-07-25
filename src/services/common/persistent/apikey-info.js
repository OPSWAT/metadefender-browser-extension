'use strict';

import MCL from '../../../config/config';
import BrowserStorage from '../../common/browser/browser-storage';

/**
 *
 * @returns {{apikey: null, reputationLimit: null, preventionLimit: null, feedLimit: null, paidUser: null, limitInterval: string, loggedIn: boolean, init: init, save: save, load: load, parseMclInfo: parseMclInfo, merge: merge}}
 * @constructor
 */
function ApikeyInfo() {

    return {
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

        // methods
        init: init,
        save: save,
        load: load,
        parseMclInfo: parseMclInfo,
        merge: merge
    };
}

export const apikeyInfo = ApikeyInfo();

/**
 *
 * @returns {Promise.<*>}
 */
async function init() {
    const data = await BrowserStorage.get(MCL.config.storageKey.apikey);

    if (typeof data === 'undefined') {
        return this.save();
    }

    this.merge(data);

    return data;
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
 * @returns {Promise.<*>}
 */
async function save() {
    await BrowserStorage.set({
        [MCL.config.storageKey.apikey]: {
            apikey: this.apikey,
            reputationLimit: this.reputationLimit,
            preventionLimit: this.preventionLimit,
            feedLimit: this.feedLimit,
            paidUser: this.paidUser,
            limitInterval: this.limitInterval,
            maxUploadFileSize: this.maxUploadFileSize,
            sandboxLimit: this.sandboxLimit,
            loggedIn: this.loggedIn,
            organization: this.organization || null
        }
    });
}

/**
 *
 * @param info
 */
function parseMclInfo(info) {
    this.reputationLimit = info.limit_reputation;
    this.preventionLimit = info.limit_prevention;
    this.feedLimit = info.limit_feed;
    this.paidUser = info.paid_user;
    this.limitInterval = info.time_interval;
    this.maxUploadFileSize = info.max_upload_file_size;
    this.sandboxLimit = info.limit_sandbox;
    this.organization = info.organization || null;
}

/**
 *
 * @returns {Promise.<void>}
 */
async function load() {
    const data = await BrowserStorage.get(MCL.config.storageKey.apikey);
    this.merge(data);

    return data;
}
