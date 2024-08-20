import browserNotification from './browser/browser-notification';
import fileProcessor from './file-processor';
import MetascanClient from './metascan-client';
import { apikeyInfo } from './persistent/apikey-info';

global.chrome = {
    i18n: { getMessage: (str) => str },
    storage: {
        local: {
            get: () => null,
            set: () => null,
        }
    }
};

const mockScanHistory = {
    updateFileById: jest.fn().mockResolvedValue(),
};

global.scanHistory = mockScanHistory;
const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('./scan-file', () => {


    class MockScan {
        isSanitizedFile = () => false;
        getScanStatusLabel = () => 1;
        getFileData = () => null;
        getMd5Hash = () => null;
        getScanStatus = () => undefined;
        updateFileById = () => 200;
    }

    MockScan.STATUS = { INFECTED: false };

    return MockScan;
});

jest.mock('../../config/config', () => ({
    config: {
        fileSizeLimit: 100,
        mclDomain: '',
        storageKey: { scanHistory: '' },
    },
}));

jest.mock('../common/persistent/scan-history', () => ({
    scanHistory: {
        addFile: () => null,
        removeFile: () => null,
        save: () => null,
        updateFileById: () => null

    }
}));

xdescribe('file-processor', () => {
    const createSpy = jest.spyOn(browserNotification, 'create');

    describe('processTarget', () => {
        const linkUrl = 'mock/link';
        const downloadItem = { filename: 'name', fileSize: 345 };

        beforeEach(() => {
            mockFetch.mockImplementation(() => Promise.resolve({ json: () => Promise.resolve() }));
            // Mock ScanFile class and its methods
        });

        it('should create browser notification if not apikey', (done) => {
            fileProcessor.processTarget(linkUrl, downloadItem);

            setTimeout(() => {
                expect(createSpy).toHaveBeenCalledWith('undefinedApiKey');

                done();
            }, 0);
        });

        it('should start the scan when downloadItem has a valid size', (done) => {
            const linkUrl = 'http://example.com/file.txt';
            const downloadItem = { filename: 'file.txt', fileSize: 99, localPath: './' };
            fileProcessor.processTarget(linkUrl, downloadItem);

            setTimeout(() => {
                expect(createSpy).toHaveBeenCalledWith('scanStartedfile.txt', undefined);
                expect(createSpy).toHaveBeenCalledWith('scanFileError');
                done();
            }, 0);
        }, 1_0000);

        it('should start the scan without downloadItem ', (done) => {
            const linkUrl = 'http://example.com/file.txt';
            fileProcessor.processTarget(linkUrl);

            setTimeout(() => {
                expect(createSpy).toHaveBeenCalledWith('scanStartedfile.txt', undefined);
                expect(createSpy).toHaveBeenCalledWith('scanFileError');
                done();
            }, 0);
        }, 1_0000);
    });
});
