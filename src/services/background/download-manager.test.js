import FileProcessor from '../common/file-processor';
import { settings } from '../common/persistent/settings';
import DownloadManager, { getDomain } from './download-manager';

const mockDownload = jest.fn();
const mockGetDomain = jest.fn();

jest.mock('../common/scan-file', () => {
    function ScanFile() {
        return {
            download: mockDownload
        };
    }

    ScanFile.STATUS = { CLEAN: 1 };

    return ScanFile;
});

// Mock getDomain function only, without replacing DownloadManager
jest.spyOn({ getDomain }, 'getDomain').mockImplementation((url) => mockGetDomain(url));

describe('download-manager', () => {
    const processTargetSpy = jest.spyOn(FileProcessor, 'processTarget');
    const item = { id: 0, url: 'http://example.com' };
    const downloadItem = { state: { current: 'complete' }, id: item.id, url: item.url };

    let downloadManager;
    beforeEach(() => {
        downloadManager = new DownloadManager(FileProcessor);
        settings.data = { scanDownloads: true, saveCleanFiles: true, useWhiteList: true, whiteListCustom: [] };
        downloadManager.ignoreDownloads = [];
    });

    // Original Tests
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

    // Additional Tests

    it('should initialize correctly with default settings and no downloads', async () => {
        expect(downloadManager.activeDownloads).toEqual([]);
        expect(downloadManager.ignoreDownloads).toEqual([]);
        expect(downloadManager.fileProcessor).toEqual(FileProcessor);
    });

    it('should process requests and add to activeDownloads', async () => {
        const details = {
            timeStamp: Date.now(),
            initiator: 'http://initiator.com',
            url: 'http://example.com/file.txt',
        };

        await downloadManager.processRequests(details);

        expect(downloadManager.activeDownloads).toContainEqual(details);
    });

    it('should handle scan complete with clean status and download ignored', async () => {
        settings.data.saveCleanFiles = true;
        mockDownload.mockResolvedValueOnce(item);

        await downloadManager.onScanComplete({
            status: 1,
            linkUrl: item.url,
            name: 'file.txt',
            isDownload: false,
        });

        expect(downloadManager.ignoreDownloads.pop().url).toBe(item.url);
    });

    it('should handle onScanComplete with scanDownloads enabled and clean status', async () => {
        settings.data.scanDownloads = true;
        mockDownload.mockResolvedValueOnce(item);

        await downloadManager.onScanComplete({
            status: 1,
            linkUrl: item.url,
            name: 'file.txt',
            isDownload: true,
        });

        expect(downloadManager.ignoreDownloads).toHaveLength(1);
        expect(downloadManager.ignoreDownloads[0].url).toBe(item.url);
    });

    it('should not process if the URL is in ignoreDownloads', async () => {
        const urlToIgnore = 'http://example.com/file.txt';
        downloadManager.ignoreDownloads.push({ id: 'ignored-id', url: urlToIgnore });

        await downloadManager.processDownloads({ finalUrl: urlToIgnore });

        expect(processTargetSpy).not.toHaveBeenCalled();
    });

    it('should call processTarget when file is ready for scanning', async () => {
        const testDownloadItem = { id: 1, finalUrl: 'http://example.com/file.txt' };

        await downloadManager.processTarget(testDownloadItem.finalUrl, testDownloadItem);

        expect(processTargetSpy).toHaveBeenCalledWith(testDownloadItem.finalUrl, testDownloadItem);
    });

    it('should filter out completed downloads from ignoreDownloads', async () => {
        const completedDownload = { id: item.id, state: { current: 'complete' } };
        downloadManager.ignoreDownloads.push({ id: item.id, url: item.url });

        await downloadManager.processCompleteDownloads(completedDownload);

        expect(downloadManager.ignoreDownloads).toHaveLength(0);
    });

    it('should skip processing when downloadItem is not found in ignoreDownloads', async () => {
        const complete = { state: { current: 'complete' }, id: 0 };

        await downloadManager.processCompleteDownloads(complete);

        expect(downloadManager.ignoreDownloads).toEqual([]);
    });

    it('should process downloads if scanDownloads is disabled and ignore them', async () => {
        settings.data.scanDownloads = false;

        await downloadManager.processDownloads(downloadItem);

        expect(downloadManager.ignoreDownloads).toEqual([]);
        expect(processTargetSpy).not.toHaveBeenCalled();
    });
});
