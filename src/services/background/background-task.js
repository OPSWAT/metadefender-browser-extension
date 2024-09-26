import MCL from '../../config/config';

import { settings } from '../common/persistent/settings';
import { apikeyInfo } from '../common/persistent/apikey-info';
import { scanHistory } from '../common/persistent/scan-history';

import CoreClient from '../common/core-client';
import MetascanClient from '../common/metascan-client';
import FileProcessor from '../common/file-processor';
import cookieManager from './cookie-manager';
import DownloadManager from './download-manager';
import { goToTab } from './navigation';
import SafeUrl from './safe-url';

import BrowserNotification from '../common/browser/browser-notification';
import BrowserStorage from '../common/browser/browser-storage';

const MCL_CONFIG = MCL.config;

const contextMenus = {};

export default class BackgroundTask {
    constructor() {
        this.id = Math.random();
        this.apikeyInfo = apikeyInfo;
        this.settings = settings;
        this.scanHistory = scanHistory;
        this.downloadsManager = new DownloadManager(FileProcessor);

        chrome.runtime.onInstalled.addListener(this.onInstallExtensionListener.bind(this));
    }

    async getAuthCookie() {
        const cookie = await cookieManager.get();

        if (cookie) {
            this.setApikey(cookie.value);
        } else {
            setTimeout(this.getAuthCookie.bind(this), 300);
        }
    }

    async init() {
        try {
            await this.settings.init();
            await this.apikeyInfo.init();
            await this.scanHistory.init();
            await this.scanHistory.cleanPendingFiles();
            await SafeUrl.init();
        } catch (error) {
            console.warn(error);
        }

        MetascanClient
            .configure({
                pollingIncrementor: MCL_CONFIG.scanResults.incrementor,
                pollingMaxInterval: MCL_CONFIG.scanResults.maxInterval
            })
            .setHost(MCL_CONFIG.metadefenderDomain)
            .setVersion(MCL_CONFIG.metadefenderVersion);

        CoreClient.configure({
            apikey: this.settings.data.coreApikey,
            endpoint: this.settings.data.coreUrl,
            pollingIncrementor: MCL_CONFIG.scanResults.incrementor,
            pollingMaxInterval: MCL_CONFIG.scanResults.maxInterval,
        });

        cookieManager.onChange(({ cookie, removed }) => {
            if (!MCL_CONFIG.mclDomain.endsWith(cookie.domain) || MCL_CONFIG.authCookieName !== cookie.name || removed) {
                return;
            }

            this.setApikey(cookie.value);
        });

        chrome.contextMenus.onClicked.addListener(this.handleContextMenuClicks.bind(this));
        chrome.notifications.onClicked.addListener(this.handleNotificationClicks.bind(this));
        chrome.notifications.onClosed.addListener(() => { });

        chrome.webRequest.onCompleted.addListener(this.downloadsManager.processRequests.bind(this.downloadsManager), { urls: ['<all_urls>'], types: ['xmlhttprequest'] });
        chrome.downloads.onDeterminingFilename.addListener(this.downloadsManager.processDownloads.bind(this.downloadsManager));
        chrome.downloads.onChanged.addListener(this.downloadsManager.processCompleteDownloads.bind(this.downloadsManager));
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'managed') {
                this.handleManagedSettings();
            }
        });

        BrowserStorage.addListener(this.browserStorageListener.bind(this));

        this.setupContextMenu(this.settings.data.saveCleanFiles);
        await this.getAuthCookie();

        SafeUrl.toggle(this.settings.data.safeUrl);
    }

    async handleManagedSettings() {
        await chrome.storage.managed.get(null, async (managed) => {
            const isManaged = Object.keys(managed).length > 0;

            if (!isManaged) {
                return;
            }

            this.settings.merge({
                isManaged,
                scanDownloads: managed?.scan_downloads,
                useCore: managed?.use_core,
                coreApikey: managed?.core_apikey,
                coreUrl: managed?.core_url,
                shareResults: managed?.share_results,
                saveCleanFiles: managed?.save_clean_files,
                skipLimit: managed?.skip_limit,
                fileSizeLimit: managed?.file_size_limit,
                useWhiteList: managed?.use_whitelist,
                whiteListCustom: managed?.white_list_custom,
                safeUrl: managed?.safe_url,
                showNotifications: managed?.show_notifications
            });

            await this.settings.save();

            console.log('Settings:', this.settings);
        });
    }

    /**
     * contexts: ['all', 'page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio', 'launcher', 'browser_action', 'page_action']
     * @param saveCleanFiles
     */
    setupContextMenu(saveCleanFiles) {
        const title = (saveCleanFiles) ? 'contextMenuScanAndDownloadTitle' : 'contextMenuScanTitle';
        return chrome.contextMenus.removeAll(() => {
            const menuId = chrome.contextMenus.create({
                id: MCL_CONFIG.contextMenu.scanId,
                title: chrome.i18n.getMessage(title),
                contexts: ['link', 'image', 'video', 'audio']
            });
            contextMenus[menuId] = menuId;
        });
    }

    /**
     * Updates extension authentication info
     *
     * @param {string} cookieValue
     */

    async updateApikeyInfo(apikey, loggedIn) {
        try {
            const response = await MetascanClient.apikey.info(apikey);

            if (response?.error) {
                setTimeout(() => {
                    BrowserNotification.create(response.error.messages.join(', '));
                }, 5000);
                return;
            }

            this.apikeyInfo.data.apikey = apikey;
            this.apikeyInfo.data.loggedIn = loggedIn;
            this.apikeyInfo.parseMclInfo(response);
            await this.apikeyInfo.save();

            this.settings.data.shareResults = this.settings.data.shareResults || !this.apikeyInfo.data.paidUser;
            await this.settings.save();
        } catch (error) {
            console.warn(error);
        }
    }

    async setApikey(cookieValue) {
        let cookieData = decodeURIComponent(cookieValue);
        const settingsData = await this.settings.load();

        if (settingsData?.apikeyCustom && settingsData.apikeyCustom !== "") {
            await this.updateApikeyInfo(settingsData?.apikeyCustom, true);
            return;
        }

        try {
            cookieData = JSON.parse(cookieData);
        } catch (error) {
            BrowserNotification.create(error, 'info');
            _gaq.push(['exception', { exDescription: 'background-task:setApikey' + JSON.stringify(error) }]);
        }

        if (this.apikeyInfo.data.apikey === cookieData.apikey && this.apikeyInfo.data.loggedIn === cookieData.loggedIn) {
            return;
        }

        await this.updateApikeyInfo(cookieData?.apikey, cookieData?.loggedIn);
    }

    onInstallExtensionListener(details) {
        this.handleManagedSettings();
        
        if (details.reason === 'install') {
            chrome.tabs.create({
                url: `${MCL_CONFIG.mclDomain}/extension/get-apikey`
            });

            chrome.tabs.create({
                url: 'index.html#/about'
            });
        } else if (details.reason === 'update') {
            this.updateExtensionFrom(details.previousVersion);
        }
    }

    async handleContextMenuClicks(info) {
        if (info.menuItemId !== MCL_CONFIG.contextMenu.scanId) {
            return;
        }

        const target = info.srcUrl || info.linkUrl || info.pageUrl;

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
    handleNotificationClicks(notificationId) {
        if (notificationId == 'info') {
            return;
        }
        goToTab('history');
    }

    /**
     * Update extension items in context menu.
     */
    updateContextMenu(saveCleanFiles) {
        const title = (saveCleanFiles) ? 'contextMenuScanAndDownloadTitle' : 'contextMenuScanTitle';
        if (contextMenus[MCL_CONFIG.contextMenu.scanId]) {
            chrome.contextMenus.update(MCL_CONFIG.contextMenu.scanId, {
                title: chrome.i18n.getMessage(title)
            });
        }
    }

    /**
     * Handle browser messages.
     *
     * @param message
     * @returns {Promise.<void>}
     */
    async browserStorageListener(data) {
        for (const key of Object.keys(data)) {
            switch (key) {
                case MCL_CONFIG.storageKey.apikeyInfo: {
                    await this.apikeyInfo.load();
                    break;
                }
                case MCL_CONFIG.storageKey.settings: {
                    const settingsData = await this.settings.load();

                    this.updateContextMenu(settingsData.saveCleanFiles);
                    SafeUrl.toggle(settingsData.safeUrl);
                    CoreClient.configure({
                        apikey: settingsData.coreApikey,
                        endpoint: settingsData.coreUrl,
                    });
                    break;
                }
                case MCL_CONFIG.storageKey.scanHistory: {
                    await this.scanHistory.load();
                    break;
                }
                default: {
                    break;
                }
            }
        }
    }
}

export const Task = new BackgroundTask();
