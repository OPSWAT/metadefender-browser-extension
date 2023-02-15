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

    it('shuld initialize correct', () => {
        downloadManager = new DownloadManager(FileProcessor);

        expect(downloadManager.activeDownloads).toEqual([]);
        expect(downloadManager.ignoreDownloads).toEqual([]);
        expect(downloadManager.fileProcessor).toEqual(FileProcessor);

        expect(initSpy).toHaveBeenCalled();
    });

    it('should handle scan complete', async () => {
        const dlId = 'dlId';
        settings.saveCleanFiles = true;
        mockDownload.mockImplementationOnce(() => dlId);

        await downloadManager.onScanComplete({
            status: 1,
            downloaded: false,
        });

        expect(downloadManager.ignoreDownloads).toHaveLength(1);
        expect(downloadManager.ignoreDownloads[0]).toEqual(dlId);
    });

    it('should track download', () => {
        const inProgress = { state: 'in_progress', id: 0 };

        settings.scanDownloads = false;
        expect(downloadManager.trackInProgressDownloads()).toEqual(undefined);

        settings.scanDownloads = true;
        downloadManager.trackInProgressDownloads({ state: 'mock' });
        expect(downloadManager.activeDownloads).toHaveLength(0);

        downloadManager.trackInProgressDownloads(inProgress);
        expect(downloadManager.activeDownloads).toHaveLength(1);
        expect(downloadManager.activeDownloads[0]).toEqual(inProgress);
    });

    it('should update active download', () => {
        const downloadItem = { filename: { current: 'mock' }, id: 0 };
        downloadManager.updateActiveDownloads(downloadItem);
    });

    it('should proceess complete downloads', async () => {
        const complete = { state: { current: 'complete' }, id: 0 };

        await downloadManager.processCompleteDownloads(complete);

        expect(proceessTargetSpy).toHaveBeenCalled();
    });
});