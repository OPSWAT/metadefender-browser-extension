import { settings } from '../common/persistent/settings';
import ScanFile from '../common/scan-file';

export const getDomain = (url, allowList = []) => {
    return new Promise((resolve, reject) => {
        try {
            if (url.startsWith('blob:')) {
                url = url.substring(5);
            }
            let urlObj = new URL(url);
            let hostname = urlObj.hostname;
            hostname = hostname.replace(/^www\./, '').replace(/^m\./, '');

            const isExplicitlyAllowed = allowList.some(allowedDomain => allowedDomain === hostname);

            if (isExplicitlyAllowed) {
                resolve(hostname);
                return;
            }

            const isBlockedByWildcard = allowList.some(allowedDomain => {
                if (allowedDomain.startsWith('*.')) {
                    const baseDomain = allowedDomain.substring(2);
                    return hostname.endsWith(`.${baseDomain}`);
                }
                return false;
            });

            if (!isBlockedByWildcard) {
                resolve(hostname);
            } else {
                resolve(null);
            }
        } catch (error) {
            reject('Invalid URL');
        }
    });
};

class DownloadManager {
    constructor(fileProcessor) {
        this.activeDownloads = [];
        this.ignoreDownloads = [];
        this.fileProcessor = fileProcessor;
        this.settings = settings;

        fileProcessor.addOnScanCompleteListener(this.onScanComplete.bind(this));
    }

    async onScanComplete(payload) {
        const { status, linkUrl, name, isDownload } = payload;

        const isScanDownloads = this.settings.data.scanDownloads && isDownload && status === ScanFile.STATUS.CLEAN;
        const isSaveCleanFiles = this.settings.data.saveCleanFiles && status === ScanFile.STATUS.CLEAN;

        if (isScanDownloads || isSaveCleanFiles) {
            this.ignoreDownloads.push({ id: '', url: linkUrl });
            chrome.downloads.download({ url: linkUrl, filename: name }, (downloadId) => {
                const item = this.ignoreDownloads.find(({ url }) => url === linkUrl);
                item.id = downloadId;
            });
        }
    }

    async processRequests(details) {
        this.activeDownloads.push({
            timeStamp: details.timeStamp,
            initiator: details.initiator,
            url: details.url,
        });
    }

    async processDownloads(downloadItem) {
        let originalUrl = downloadItem.finalUrl;
        const dateStartTime = new Date(downloadItem.startTime);
        const startTime = dateStartTime.getTime();

        const isBlobUrl = /^blob:/i.test(downloadItem.finalUrl);
        const urlMatch = this.activeDownloads.find(({ timeStamp, initiator }) => ((startTime - timeStamp < 10) && downloadItem.finalUrl?.includes(initiator)));

        if (isBlobUrl && urlMatch) {
            originalUrl = urlMatch.url;
        }

        if (!this.settings.data.scanDownloads) {
            return;
        }

        if (this.ignoreDownloads.find(({ url }) => url === originalUrl)) {
            return;
        }

        const urlToUse = downloadItem.referrer || downloadItem.url;
        const domain = await getDomain(urlToUse);
        if (settings?.data?.useWhiteList === true && domain) {
            const whiteList = settings?.data?.whiteListCustom || [];
            const isWhitelisted = whiteList.some(allowedDomain => {
                if (allowedDomain.startsWith('*.')) {
                    const baseDomain = allowedDomain.substring(2);
                    return domain === baseDomain || domain.endsWith(`.${baseDomain}`);
                }
                return domain === allowedDomain;
            });

            if (isWhitelisted) {
                return;
            }
        }

        chrome.downloads.search({ id: downloadItem.id }, (results) => {
            const item = results?.shift();
            const itemId = item?.id;
            if (itemId) {
                chrome.downloads.cancel(itemId);
            }
        });

        await this.processTarget(originalUrl, downloadItem);
    }

    async processCompleteDownloads(downloadItem) {
        if (downloadItem?.state?.current === 'complete') {
            this.ignoreDownloads = this.ignoreDownloads.filter(({ id }) => id !== downloadItem.id);
        }
    }

    /**
     * Process context menu event targets.
     * 
     * @param linkUrl
    // @param downloadItem
     * @returns {Promise.<void>}
     */
    async processTarget(linkUrl, downloadItem) {
        await this.fileProcessor.processTarget(linkUrl, downloadItem);
    }
}

export default DownloadManager;
