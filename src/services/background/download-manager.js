import { settings } from '../common/persistent/settings';
import ScanFile from '../common/scan-file';

class DownloadManager {
    constructor(fileProcessor) {
        this.ignoreDownloads = [];
        this.fileProcessor = fileProcessor;
        this.settings = settings;

        fileProcessor.addOnScanCompleteListener(this.onScanComplete.bind(this));
    }

    async onScanComplete(payload) {
        const { status, linkUrl, name } = payload;

        if (this.settings.data.saveCleanFiles && status === ScanFile.STATUS.CLEAN) {
            this.ignoreDownloads.push({ id: '', url: linkUrl });
            chrome.downloads.download({ url: linkUrl, filename: name }, (downloadId) => {
                const item = this.ignoreDownloads.find(({ url }) => url === linkUrl);
                item.id = downloadId;
            });
        }
    }

    async processDownloads(downloadItem) {
        if (!this.settings.data.scanDownloads) {
            return;
        }

        if (this.ignoreDownloads.find(({ url }) => url === downloadItem.finalUrl)) {
            return;
        }

        chrome.downloads.search({ id: downloadItem.id }, (results) => {
            const item = results?.shift();
            const itemId = item?.id;
            if (itemId) {
                chrome.downloads.cancel(itemId);
            }
        });

        await this.processTarget(downloadItem.finalUrl, downloadItem);
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
