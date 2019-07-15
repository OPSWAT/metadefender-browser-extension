import 'chromereload/devonly';

import '../common/config';

import browserNotification from '../common/browser/browser-notification';
import browserMessage from '../common/browser/browser-message';
import { BROWSER_EVENT } from '../common/browser/browser-message-event';

import { settings } from '../common/persistent/settings';
import { apikeyInfo } from '../common/persistent/apikey-info';
import { scanHistory } from '../common/persistent/scan-history';
import MetascanClient from '../common/metascan-client';
import FileProcessor from '../common/file-processor';

import cookieManager from './cookie-manager';
import DownloadsManager from './download-manager';
import { goToTab } from './navigation';
import SafeUrl from './safe-url';

const MCL_CONFIG = MCL.config;

class BackgroundTask {

    constructor() {

        this.apikeyInfo = apikeyInfo;
        this.settings = settings;
        this.scanHistory = scanHistory;

        MetascanClient
            .configure({
                pollingIncrementor: MCL_CONFIG.scanResults.incrementor,
                pollingMaxInterval: MCL_CONFIG.scanResults.maxInterval
            })
            .setHost(MCL_CONFIG.metadefenderDomain)
            .setVersion(MCL_CONFIG.metadefenderVersion);

        this.fileProcessor = new FileProcessor(MetascanClient);

        cookieManager.onChange(info => {
            const cookie = info.cookie;
    
            if (!MCL_CONFIG.mclDomain.endsWith(cookie.domain) || MCL_CONFIG.authCookieName !== cookie.name || info.removed) {
                return;
            }
    
            this.setApikey(cookie.value);
        });
        
        chrome.runtime.onInstalled.addListener(this.onInstallExtensionListener.bind(this));

        chrome.contextMenus.onClicked.addListener(this.handleContextMenuClicks.bind(this));

        chrome.notifications.onClicked.addListener(this.handleNotificationClicks.bind(this));
        chrome.notifications.onClosed.addListener(() => { });

        browserMessage.addListener(this.messageListener.bind(this));

    }
    
    async init() {
        const settings = this.settings;
        const apiKeyInfo = this.apikeyInfo;
        const scanHistory = this.scanHistory;
        const fileProcessor = this.fileProcessor;

        await settings.init();
        await apiKeyInfo.init();
        await scanHistory.init();
        await scanHistory.cleanPendingFiles();
        await fileProcessor.init();

        this.downloadsManager = new DownloadsManager(fileProcessor);
        const downloadsManager = this.downloadsManager;

        chrome.downloads.onCreated.addListener(downloadsManager.trackInProgressDownloads.bind(downloadsManager));
        chrome.downloads.onChanged.addListener(downloadsManager.updateActiveDownloads.bind(downloadsManager));
        chrome.downloads.onChanged.addListener(downloadsManager.processCompleteDownloads.bind(downloadsManager));

        this.setupContextMenu(settings.saveCleanFiles);

        cookieManager.get( cookie => {
            if (cookie) {
                this.setApikey(cookie.value);
            }
        });

        SafeUrl.toggle(settings.safeUrl);
    }

    /**
     * contexts: ['all', 'page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio', 'launcher', 'browser_action', 'page_action']
     * @param saveCleanFiles
     */
    setupContextMenu(saveCleanFiles) {
        let title = (saveCleanFiles) ? 'contextMenuScanAndDownloadTitle' : 'contextMenuScanTitle';
        chrome.contextMenus.create({
            id: MCL.config.contextMenu.scanId,
            title: chrome.i18n.getMessage(title),
            contexts: ['link', 'image', 'video', 'audio']
        });
    }

    /**
     * Updates extension authentication info
     *  
     * @param {string} cookieValue
     */
    async setApikey(cookieValue) {
        let cookieData = decodeURIComponent(cookieValue);
        const apikeyInfo = this.apikeyInfo;

        try {
            cookieData = JSON.parse(cookieData);
        } catch (error) {
            console.log('setApikey failed', error);
        }

        if (apikeyInfo.apikey === cookieData.apikey && apikeyInfo.loggedIn === cookieData.loggedIn) {
            return;
        }

        const response = await MetascanClient.apikey.info(cookieData.apikey);

        if (response && response.error) {
            browserNotification.create(response.error.messages.join(', '));
            return;
        }

        this.apikeyInfo.apikey = cookieData.apikey;
        this.apikeyInfo.loggedIn = cookieData.loggedIn;
        this.apikeyInfo.parseMclInfo(response);
        
        await apikeyInfo.save();

        this.settings.shareResults = this.settings.shareResults || !this.apikeyInfo.paidUser;
        await this.settings.save();

        browserMessage.send({ event: BROWSER_EVENT.APIKEY_UPDATED });
        browserMessage.send({ event: BROWSER_EVENT.CLOSE_LOGIN });
    }

    onInstallExtensionListener(details) {
        if (details.reason === 'install') {
            chrome.tabs.create({
                url: `${MCL.config.mclDomain}/extension/get-apikey`
            });
            chrome.tabs.create({
                url: 'html/extension.html#!/about'
            });
        } else if (details.reason === 'update') {
            this.updateExtensionFrom(details.previousVersion);
        }
    }

    async handleContextMenuClicks(info) {
        if (info.menuItemId !== MCL_CONFIG.contextMenu.scanId) {
            return;
        }

        let target = info.srcUrl || info.linkUrl || info.pageUrl;

        await this.processTarget(target);
    }

    /**
     * Process context menu event targets.
     * 
     * @param linkUrl
     * @param downloadItem
     * @returns {Promise.<void>}
     */
    async processTarget(linkUrl, downloadItem) {         
        await this.downloadsManager.processTarget(linkUrl, downloadItem);
    }

    /**
     * Extension updates handler.
     * 
     * @param previousVersion
     * @returns {Promise<void>}
     */
    updateExtensionFrom(previousVersion) {
        if (previousVersion === chrome.runtime.getManifest().version) {
            return;
        }

        chrome.tabs.create({
            url: `${MCL_CONFIG.mclDomain}/extension/get-apikey`
        });
    }
    
    /**
     * Extension notifications click event handler
     */
    async handleNotificationClicks() {
        goToTab('history');
    }

    /**
     * Update extension items in context menu.
     */
    updateContextMenu() {
        const saveCleanFiles = this.settings.saveCleanFiles;
        let title = (saveCleanFiles) ? 'contextMenuScanAndDownloadTitle' : 'contextMenuScanTitle';
        chrome.contextMenus.update(MCL.config.contextMenu.scanId, {
            title: chrome.i18n.getMessage(title)
        });
    }

    /**
     * Handle browser messages.
     * 
     * @param message
     * @returns {Promise.<void>}
     */
    async messageListener(message) {
        const settings = this.settings;

        switch (message.event) {
            case BROWSER_EVENT.SETTINGS_UPDATED: {
                let saveCleanFiles = settings.saveCleanFiles;

                await settings.load();

                if (settings.saveCleanFiles !== saveCleanFiles) {
                    this.updateContextMenu();
                }

                SafeUrl.toggle(settings.safeUrl);
                
                break;
            }
            case BROWSER_EVENT.SCAN_FILES_UPDATED: {
                this.scanHistory.load();
                break;
            }
            case BROWSER_EVENT.GO_TO_HISTORY: {
                goToTab('history');
                break;
            }
            case BROWSER_EVENT.GO_TO_SETTINGS: {
                goToTab('settings');
                break;
            }
        }
    }
}

export const Task = new BackgroundTask();