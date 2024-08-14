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
    const initSpy = jest.spyOn(settings, 'init');
    const proceessTargetSpy = jest.spyOn(FileProcessor, 'processTarget');

    let downloadManager;
    beforeEach(() => {
        downloadManager = new DownloadManager(FileProcessor);
    });

    it('should initialize correct', async () => {
        downloadManager = new DownloadManager(FileProcessor);

        expect(downloadManager.activeDownloads).toEqual([]);
        expect(downloadManager.ignoreDownloads).toEqual([]);
        expect(downloadManager.fileProcessor).toEqual(FileProcessor);

    });

    it('should handle scan complete when scan is clean and not downloaded', async () => {
        const dlId = 'dlId';
        settings.data.saveCleanFiles = true;
        mockDownload.mockResolvedValueOnce(dlId);

        await downloadManager.onScanComplete({
            status: 1,
            downloaded: false,
            linkUrl: 'http://example.com',
            fileData: {},
            name: 'file.txt'
        });

        expect(downloadManager.ignoreDownloads).toContain(dlId);
    });
    it('should track download', () => {
        const inProgress = { state: 'in_progress', id: 0 };

        settings.scanDownloads = false;
        expect(downloadManager.trackInProgressDownloads()).toEqual(undefined);

        settings.scanDownloads = true;
        downloadManager.trackInProgressDownloads({ state: 'mock' });
        expect(downloadManager.activeDownloads).toHaveLength(0);

        downloadManager.trackInProgressDownloads(inProgress);
        expect(downloadManager.activeDownloads).toHaveLength(0);
        expect(downloadManager.activeDownloads[0]).toEqual(undefined);
    });

    it('should update active download', () => {

        const downloadItem = { filename: { current: 'mock' }, state: { current: undefined }, id: 0 };
        downloadManager.updateActiveDownloads(downloadItem);
    });

    it('should proceess complete downloads', async () => {
        const complete = { state: { current: 'complete' }, id: 0 };

        await downloadManager.processCompleteDownloads(complete);

        expect(proceessTargetSpy);
    });

    it('should update active downloads correctly', () => {
        settings.data.scanDownloads = true;
        const downloadItem = { filename: { current: 'C:\\path\\to\\file.txt' }, id: 0 };

        downloadManager.activeDownloads[0] = downloadItem;
        downloadManager.updateActiveDownloads(downloadItem);

        expect(downloadManager.activeDownloads[0].filename).toEqual('file.txt');
        expect(downloadManager.activeDownloads[0].localPath).toEqual('file://C:\\path\\to\\file.txt');
    });

    it('should remove download from activeDownloads and ignoreDownloads when processing complete download', async () => {
        settings.data.scanDownloads = true;
        const downloadItem = { state: { current: 'complete' }, id: 0, url: 'http://example.com' };

        downloadManager.activeDownloads[0] = downloadItem;
        await downloadManager.processCompleteDownloads(downloadItem);

        expect(downloadManager.activeDownloads).toHaveLength(1);
    });

    it('should handle missing downloadItem in processCompleteDownloads', async () => {
        settings.data.scanDownloads = true;
        const downloadItem = { state: { current: 'complete' }, id: 1 };

        await downloadManager.processCompleteDownloads(downloadItem);

        expect(downloadManager.activeDownloads).toHaveLength(0);
    });

    it('should update active downloads correctly', () => {
        settings.data.scanDownloads = true;
        const ignoreId = 0;
        const downloadItem = { filename: { current: 'C:\\path\\to\\file.txt' }, id: ignoreId };

        downloadManager.ignoreDownloads.push(ignoreId);
        downloadManager.activeDownloads[ignoreId] = { id: ignoreId };

        downloadManager.updateActiveDownloads(downloadItem);

        expect(downloadManager.ignoreDownloads).not.toContain(ignoreId);
        expect(downloadManager.activeDownloads[ignoreId]).toBeUndefined();
    });

});