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

    trackInProgressDownloads(downloadItem) {
        if (!settings.data.scanDownloads) {
            return;
        }

        if (downloadItem.state === 'in_progress') {
            this.activeDownloads[downloadItem?.id] = downloadItem;
        }
    }

    /**
     * Updates active file downloads.
     * 
     * @param downloadItem
     * @returns {Promise.<void>}
     */
    updateActiveDownloads(downloadItem) {
        const ignoreDownloads = this.ignoreDownloads;
        const activeDownloads = this.activeDownloads;

        if (!this.settings.data.scanDownloads || typeof downloadItem.filename === 'undefined') {
            return;
        }

        const ignoreDl = ignoreDownloads.indexOf(downloadItem?.id);
        if (ignoreDl >= 0) {

            // download initiated by extension, don't download again
            ignoreDownloads.splice(ignoreDownloads.indexOf(downloadItem?.id), 1);
            delete activeDownloads[downloadItem?.id];
            return;
        }

        const filepath = downloadItem.filename.current;

        let idx = filepath.lastIndexOf('\\');
        if (idx === -1) {
            idx = filepath.lastIndexOf('/');
        }
        const filename = filepath.substring(idx + 1);

        activeDownloads[downloadItem?.id].filename = filename;
        activeDownloads[downloadItem?.id].localPath = 'file://' + filepath;
    }

    /**
     * Process completed file downloads.
     * 
     * @param downloadItem
     * @returns {Promise.<void>}
     */
    async processCompleteDownloads(downloadItem) {
        const settings = this.settings;
        const activeDownloads = this.activeDownloads;
        if (!settings.data?.scanDownloads) {
            return;
        }

        if (typeof downloadItem.state === 'undefined' || downloadItem?.state?.current !== 'complete') {
            return;
        }

        if (!activeDownloads[downloadItem?.id]) {
            return;
        }

        downloadItem = activeDownloads[downloadItem?.id];
        await this.processTarget(downloadItem.url, downloadItem);
        delete activeDownloads[downloadItem?.id];
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
