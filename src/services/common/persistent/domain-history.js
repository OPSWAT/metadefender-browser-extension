'use strict';

import MCL from '../../../config/config';
import BrowserStorage from './../browser/browser-storage';

const storageKey = MCL.config.storageKey.domainHistory;

function DomainHistory() {
    return {
        domains: [],

        //methods
        init,
        load,
        save,
        merge,
        updateDomainById,
        updateDomainByDataId,
        addDomain,
        removeDomain,
        clear
    }
}

export const domainHistory = DomainHistory();

async function init() {
    const { [storageKey]: domainData } = await BrowserStorage.get(storageKey);
    if(!domainData) {
        return this.save();
    }

    this.merge(domainData);
}

async function load() {
    const { [storageKey]: domainData } = await BrowserStorage.get(storageKey);
    this.merge(domainData);

    return domainData;
}

function merge(newData) {
    for(let key in newData) {
        if(Object.prototype.hasOwnProperty.call(newData, key)) {
            this[key] = newData[key];
        }
    }
}

async function save() {
    await BrowserStorage.set({[storageKey] : {
        domains: this.domains
    }});
}

async function addDomain(domain) {
    this.domains.unshift(domain);
    this.save();
}

async function updateDomainById(id, data) {
    const domainIndex = this.domains.findIndex(domain => domain?.id === id);
    if (domainIndex === -1) {
        return;
    }
    this.domains[domainIndex] = { ...this.domains[domainIndex], ...data };
    this.save();
}

async function updateDomainByDataId(dataId, data) {
    const domainIndex = this.domains.findIndex(domain => domain?.dataId === dataId);
    if (domainIndex === -1) {
        return;
    }
    this.domains[domainIndex] = { ...this.domains[domainIndex], ...data };
    this.save();
}

async function removeDomain(id) {
    this.domains = this.domains.filter((domain) => domain.id !== id);
    await this.save();
}

async function clear() {
    this.domains = [];
    this.save();
}