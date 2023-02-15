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

const mockGetFileSize = jest.fn();

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('./scan-file', () => {
    class MockScan {
        isSanitizedFile = () => false
        getFileSize = mockGetFileSize
        getScanStatusLabel = () => 1
        getFileData = () => null
        getMd5Hash = () => null
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
        save: () => null
    }
}));

describe('file-processor', () => {
    const createSpy = jest.spyOn(browserNotification, 'create');
    const setAuthSpy = jest.spyOn(MetascanClient, 'setAuth');

    describe('processTarget', () => {
        const linkUrl = 'mock/link';

        beforeEach(() => {
            mockFetch.mockImplementation(() => Promise.resolve({ json: () => Promise.resolve() }));
        });

        it('should create browser notification if not apikey', (done) => {
            fileProcessor.processTarget(linkUrl);

            setTimeout(() => {
                expect(createSpy).toHaveBeenCalledWith('undefinedApiKey');

                done();
            }, 0);
        });

        it('should create browser notification if empty file', (done) => {
            apikeyInfo.apikey = 'mock';
            mockGetFileSize.mockImplementationOnce(() => null);

            fileProcessor.processTarget(linkUrl);

            setTimeout(() => {
                expect(createSpy).toHaveBeenCalledWith('fileEmpty');

                done();
            }, 0);
        });

        it('should create browser notification if file size too big', (done) => {
            apikeyInfo.apikey = 'mock';
            mockGetFileSize.mockImplementationOnce(() => 200);

            fileProcessor.processTarget(linkUrl);

            setTimeout(() => {
                expect(createSpy).toHaveBeenCalledWith('fileSizeLimitExceeded');

                done();
            }, 0);
        });

        it('should create browser notification with scan started', (done) => {
            apikeyInfo.apikey = 'mock';
            mockGetFileSize.mockImplementationOnce(() => 50);
            setAuthSpy.mockImplementation(() => ({
                hash: { lookup: () => ({ data_id: 'mock' }) },
                file: { poolForResults: () => ({}) }
            }));

            fileProcessor.processTarget(linkUrl, { filename: 'mock', fileSize: 50 });

            setTimeout(() => {
                expect(createSpy).toHaveBeenCalledWith('scanStartedmock', undefined);

                done();
            }, 0);
        });
    });

    describe('handleFileScanResults', () => {
        it('should do something', (done) => {
            const info = { file_info: { sha256: 'mock sha256' } };
            const file = { fileName: 'mock' };

            fileProcessor.handleFileScanResults(file, info, 'mock', {}, true);

            setTimeout(() => {
                expect(createSpy).toHaveBeenCalledWith('mockfileScanCompletenoThreatDetected', undefined, false);
                done();
            }, 0);
        });
    });
});