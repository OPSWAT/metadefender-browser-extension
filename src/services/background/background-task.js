
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
import browserNotification from '../common/browser/browser-notification';
import browserStorage from '../common/browser/browser-storage';

const MCL_CONFIG = MCL.config;
export default class BackgroundTask {
    constructor() {
        this.apikeyInfo = apikeyInfo;
        this.settings = settings;
        this.scanHistory = scanHistory;
        this.downloadsManager = new DownloadManager(FileProcessor);

        cookieManager.onChange(({ cookie, removed }) => {
            if (!MCL_CONFIG.mclDomain.endsWith(cookie.domain) || MCL_CONFIG.authCookieName !== cookie.name || removed) {
                return;
            }

            this.setApikey(cookie.value);
        });

        browserStorage.addListener(this.messageListener.bind(this));
    }

    getApikeyInfo() {
        return this.apikeyInfo;
    }

    getScanHistory() {
        return this.scanHistory;
    }

    getSettings() {
        return this.settings;
    }

    init() {
        const apiKeyInfo = this.apikeyInfo;
        const settingsObj = this.settings;
        const scanHistoryObj = this.scanHistory;

        (async () => {
            try {
                await settingsObj.init();
                await apiKeyInfo.init();
                await scanHistoryObj.init();
                await scanHistoryObj.cleanPendingFiles();
                await SafeUrl.init();
            } catch (error) {
                console.log(error);
            }
        })();

        MetascanClient.configure({
            pollingIncrementor: MCL_CONFIG.scanResults.incrementor,
            pollingMaxInterval: MCL_CONFIG.scanResults.maxInterval
        })
            .setHost(MCL_CONFIG.metadefenderDomain)
            .setVersion(MCL_CONFIG.metadefenderVersion);

        CoreClient.configure({
            apikey: settingsObj.coreApikey,
            endpoint: settingsObj.coreUrl,
            pollingIncrementor: MCL_CONFIG.scanResults.incrementor,
            pollingMaxInterval: MCL_CONFIG.scanResults.maxInterval,
        });

        async function getAuthCookie() {
            const cookie = await cookieManager.get();

            if (cookie) {
                this.setApikey(cookie.value);
            } else {
                setTimeout(getAuthCookie.bind(this), 300);
            }
        }

        getAuthCookie.call(this);

        SafeUrl.toggle(settingsObj.safeUrl);
    }

    /**
     * contexts: ['all', 'page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio', 'launcher', 'browser_action', 'page_action']
     * @param saveCleanFiles
     */
    setupContextMenu(saveCleanFiles) {
        const title = (saveCleanFiles) ? 'contextMenuScanAndDownloadTitle' : 'contextMenuScanTitle';
        return chrome.contextMenus.removeAll(() => chrome.contextMenus.create({
            id: MCL.config.contextMenu.scanId,
            title: chrome.i18n.getMessage(title),
            contexts: ['link', 'image', 'video', 'audio']
        }));
    }

    /**
     * Updates extension authentication info
     *  
     * @param {string} cookieValue
     */
    async setApikey(cookieValue) {
        let cookieData = decodeURIComponent(cookieValue);
        const apikeyInfoObj = this.apikeyInfo;

        try {
            cookieData = JSON.parse(cookieData);
        } catch (error) {
            browserNotification.create(error, 'info');
            _gaq.push(['exception', { exDescription: 'background-task:setApikey' + JSON.stringify(error) }]);
        }

        if (apikeyInfoObj.apikey === cookieData.apikey && apikeyInfoObj.loggedIn === cookieData.loggedIn) {
            return;
        }

        try {
            const response = await MetascanClient.apikey.info(cookieData.apikey);

            if (response?.error) {
                browserNotification.create(response.error.messages.join(', '));
                return;
            }

            this.apikeyInfo.apikey = cookieData.apikey;
            this.apikeyInfo.loggedIn = cookieData.loggedIn;
            this.apikeyInfo.parseMclInfo(response);

            await apikeyInfoObj.save();

            this.settings.shareResults = this.settings.shareResults || !this.apikeyInfo.paidUser;

            await this.settings.save();
        } catch (error) {
            console.log(error);
        }
    }

    onInstallExtensionListener(details) {
        this.setupContextMenu(settings.saveCleanFiles);
        if (details.reason === 'install') {
            chrome.tabs.create({
                url: `${MCL.config.mclDomain}/extension/get-apikey`
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

        if (!this.apikeyInfo.apikey) {
            this.init();
        }

        const target = info.srcUrl || info.linkUrl || info.pageUrl;
        await this.processTarget(target);
        chrome.contextMenus.onClicked.removeListener(this.handleContextMenuClicks.bind(this));
    }

    /**
     * Process context menu event targets.
     * 
     * @param linkUrl
     * @param downloadItem
     * @returns {Promise.<void>}
     */
    async processTarget(linkUrl, downloadItem) {
        await this?.downloadsManager?.processTarget?.(linkUrl, downloadItem);
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
        const settingsObj = this.settings;
        const apikeyInfoObj = this.apikeyInfo;

        if (Object.keys(message).includes('settings')) {
            const saveCleanFiles = message.settings.newValue.saveCleanFiles;

            await settingsObj.load();
            const apikey = await apikeyInfoObj.load();

            CoreClient.configure({
                apikey: apikey.apikey?.apikey,
                endpoint: settingsObj.coreUrl
            });

            this.updateContextMenu(saveCleanFiles);

            if (message.settings?.oldValue?.safeUrl !== message.settings.newValue.safeUrl) {
                SafeUrl.toggle(message.settings.newValue.safeUrl);
            }
        }
    }
}

export const Task = new BackgroundTask();

const downloadsManager = Task.downloadsManager;

chrome.downloads.onCreated.addListener(downloadsManager.trackInProgressDownloads.bind(downloadsManager));
chrome.downloads.onChanged.addListener(downloadsManager.updateActiveDownloads.bind(downloadsManager));
chrome.downloads.onChanged.addListener(downloadsManager.processCompleteDownloads.bind(downloadsManager));

chrome.notifications.onClicked.addListener(Task.handleNotificationClicks.bind(Task));

chrome.contextMenus.onClicked.addListener(Task.handleContextMenuClicks.bind(Task));

chrome.runtime.onInstalled.addListener(Task.onInstallExtensionListener.bind(Task));
