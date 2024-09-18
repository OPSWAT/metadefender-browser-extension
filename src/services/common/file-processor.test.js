import FileProcessor, { ON_SCAN_COMPLETE_LISTENERS } from './file-processor';
import ScanFile from './scan-file';
import BrowserNotification from '../common/browser/browser-notification';
import CoreClient from '../common/core-client';
import MetascanClient from '../common/metascan-client';
import { apikeyInfo } from '../common/persistent/apikey-info';
import { scanHistory } from '../common/persistent/scan-history';
import { settings } from '../common/persistent/settings';

jest.mock('./scan-file');
jest.mock('../common/browser/browser-notification');
jest.mock('../common/core-client');
jest.mock('../common/metascan-client');
jest.mock('../common/persistent/apikey-info');
jest.mock('../common/persistent/scan-history');
jest.mock('../common/persistent/settings');

describe('FileProcessor', () => {
    let fileProcessor;
    let mockFile;
    let mockFileData;

    beforeEach(() => {
        fileProcessor = FileProcessor;
        mockFile = {
            isSanitizedFile: jest.fn().mockReturnValue(false),
            getFileName: jest.fn().mockResolvedValue('testFile.txt'),
            getMd5Hash: jest.fn().mockResolvedValue('1234abcd'),
            getFileData: jest.fn().mockResolvedValue({ size: 1024 }),
            getScanStatusLabel: jest.fn().mockReturnValue('Scanning'),
            getScanStatus: jest.fn().mockReturnValue('SAFE'),
        };
        mockFileData = { size: 1024 };
        ScanFile.mockImplementation(() => mockFile);
        apikeyInfo.load.mockResolvedValue();
        apikeyInfo.data = { apikey: 'dummyApiKey' };
        settings.data = {
            useCore: true,
            coreUrl: 'https://example.com',
            fileSizeLimit: 10,
            whiteListCustom: ['example.com'],
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('processTarget should handle missing API key', async () => {
        apikeyInfo.data.apikey = null;
        await fileProcessor.processTarget('http://example.com/file.txt', null);
        expect(BrowserNotification.create).toHaveBeenCalledWith(undefined);
    });

    test('processTarget should call ScanFile methods', async () => {
        await fileProcessor.processTarget('http://example.com/file.txt', null);
        expect(mockFile.getFileName).toHaveBeenCalled();
        expect(mockFile.getMd5Hash).toHaveBeenCalled();
        expect(mockFile.getFileData).toHaveBeenCalled();
    });

    test('processTarget should handle file data', async () => {
        const mockDownloadItem = { referrer: 'http://example.com', filename: 'test.txt' };
        await fileProcessor.processTarget('http://example.com/file.txt', mockDownloadItem);

        expect(mockFile.fileName).toBe('testFile.txt');
        expect(mockFile.size).toBe(mockFileData.size);
        expect(mockFile.md5).toBe('1234abcd');
    });

    test('startStatusPolling should call CoreClient for results', async () => {
        CoreClient.file.poolForResults.mockResolvedValue({ scan_results: { scan_all_result_i: 0 } });
        await fileProcessor.startStatusPolling(mockFile, 'http://example.com/file.txt', mockFileData, false);
    });

    test('handleFileScanResults should update scan history', async () => {
        const mockInfo = {
            scan_results: { scan_all_result_i: 0 },
            file_info: { sha256: 'dummySha256' },
            data_id: 'dummyDataId',
        };
        await fileProcessor.handleFileScanResults(mockFile, mockInfo, 'http://example.com/file.txt', mockFileData, false);
        expect(scanHistory.updateFileById).toHaveBeenCalledWith(mockFile.id, mockFile);
    });

    test('scanFile should handle cloud scan', async () => {
        MetascanClient.setAuth.mockReturnValue({
            file: {
                upload: jest.fn().mockResolvedValue({ data_id: 'dummyDataId' }),
            },
        });
        await fileProcessor.scanFile(mockFile, 'http://example.com/file.txt', mockFileData, false);
        expect(mockFile.dataId).toBe(undefined);
    });

    test('addOnScanCompleteListener should add listener', () => {
        const callback = jest.fn();
        fileProcessor.addOnScanCompleteListener(callback);
        expect(ON_SCAN_COMPLETE_LISTENERS).toContain(callback);
    });

    test('removeOnScanCompleteListener should remove listener', () => {
        const callback = jest.fn();
        fileProcessor.addOnScanCompleteListener(callback);
        fileProcessor.removeOnScanCompleteListener(callback);
        expect(ON_SCAN_COMPLETE_LISTENERS).not.toContain(callback);
    });

    test('callOnScanCompleteListeners should call registered listeners', () => {
        const callback = jest.fn();
        fileProcessor.addOnScanCompleteListener(callback);
        fileProcessor.callOnScanCompleteListeners('test payload');
        expect(callback).toHaveBeenCalledWith('test payload');
    });
});
