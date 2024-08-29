import { settings } from '../common/persistent/settings';
import ScanFile from '../common/scan-file';

class DownloadManager {
    constructor(fileProcessor) {
        this.activeDownloads = [];
        this.ignoreDownloads = [];
        this.fileProcessor = fileProcessor;
        this.settings = settings;

        fileProcessor.addOnScanCompleteListener(this.onScanComplete.bind(this));
    }

    async onScanComplete(payload) {
        const { status, downloaded, fileData, linkUrl, name } = payload;

        if (this.settings.data.saveCleanFiles && status === ScanFile.STATUS.CLEAN && !downloaded) {
            const dlId = await ScanFile().download(linkUrl, fileData, name);
            this.ignoreDownloads.push(dlId);
        }
    }

    async processDownloads(downloadItem) {
        if (!this.settings.data.scanDownloads) {
            return;
        }
        chrome.downloads.search({ id: downloadItem.id }, (results) => {
            const item = results?.shift();
            if (item?.id) {
                chrome.downloads.cancel(downloadItem.id);
            }
        });

        await this.processTarget(downloadItem.finalUrl, downloadItem);
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
