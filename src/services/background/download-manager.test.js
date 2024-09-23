import FileProcessor from '../common/file-processor';
import { settings } from '../common/persistent/settings';
import DownloadManager from './download-manager';

const mockDownload = jest.fn();

jest.mock('../common/scan-file', () => {
    function ScanFile() {
        return {
            download: mockDownload
        };
    }

    ScanFile.STATUS = { CLEAN: 1 };

    return ScanFile;
});

describe('download-manager', () => {
    const processTargetSpy = jest.spyOn(FileProcessor, 'processTarget');
    const item = { id: 0, url: 'http://example.com' };
    const downloadItem = { state: { current: 'complete' }, id: item.id, url: item.url };

    let downloadManager;
    beforeEach(() => {
        downloadManager = new DownloadManager(FileProcessor);
    });

    it('should initialize correctly', async () => {
        downloadManager = new DownloadManager(FileProcessor);

        expect(downloadManager.ignoreDownloads).toEqual([]);
        expect(downloadManager.fileProcessor).toEqual(FileProcessor);
    });

    it('should handle scan complete when scan is clean and not downloaded', async () => {
        settings.data.saveCleanFiles = true;
        mockDownload.mockResolvedValueOnce(item);

        await downloadManager.onScanComplete({
            status: 1,
            linkUrl: item.url,
            name: 'file.txt',
        });

        expect(downloadManager.ignoreDownloads.pop().url).toContain(item.url);
    });

    it('should process complete downloads', async () => {
        const complete = { state: { current: 'complete' }, id: 0 };

        await downloadManager.processCompleteDownloads(complete);

        expect(processTargetSpy);
    });

    it('should remove download from ignoreDownloads when processing complete download', async () => {
        settings.data.scanDownloads = true;

        downloadManager.ignoreDownloads.push(item);
        await downloadManager.processCompleteDownloads(downloadItem);

        expect(downloadManager.ignoreDownloads).toHaveLength(0);
    });

    it('should handle missing downloadItem in processCompleteDownloads', async () => {
        settings.data.scanDownloads = true;

        await downloadManager.processCompleteDownloads(downloadItem);

        expect(downloadManager.ignoreDownloads).toHaveLength(0);
    });

    it('should process downloads without scanDownloads enabled', async () => {
        settings.data.scanDownloads = false;

        await downloadManager.processDownloads(downloadItem);

        expect(downloadManager.ignoreDownloads).toEqual([]);
        expect(processTargetSpy).not.toHaveBeenCalled();
    });

    it('should skip processing if the download is whitelisted', async () => {
        settings.data.scanDownloads = true;
        settings.data.useWhiteList = true;
        settings.data.whiteListCustom = ['example.com'];

        await downloadManager.processDownloads(downloadItem);

        expect(processTargetSpy).not.toHaveBeenCalled();
    });

    it('should block downloads not in whitelist', async () => {
        settings.data.scanDownloads = true;
        settings.data.useWhiteList = true;
        settings.data.whiteListCustom = ['*.trusted.com'];

        const nonWhitelistedItem = { state: { current: 'complete' }, id: 2, url: 'http://untrusted.com' };

        await downloadManager.processDownloads(nonWhitelistedItem);

        expect(processTargetSpy).toHaveBeenCalled();
    });
});
