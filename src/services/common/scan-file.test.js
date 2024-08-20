import ScanFile from './scan-file';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('scan-file', () => {
    const getMessageSpy = jest.spyOn(chrome.i18n, 'getMessage');

    const scanFile = new ScanFile();

    const url = 'http://mock.com';
    const urlSafe = 'https://mocl.t.files.metadefender.com';
    const urlMdcSafe = 'https://mock/file/converted/mock?apikey=mockApyKey';
    const filename = 'mock.txt';

    beforeEach(() => {
        mockFetch.mockImplementation(() => Promise.resolve({ json: () => Promise.resolve(), url: 'mockUrl', headers: { get: () => 200 } }));
    });

    describe('getFileSize', () => {
        it('should faile because of data in start of the url', async () => {
            try {
                await scanFile.getFileSize('data', filename);
            } catch (error) {
                expect(getMessageSpy).toHaveBeenCalledWith('unsupportedUrl');
            }
        });

        it('should faile because of ftp in start of the url', async () => {
            try {
                await scanFile.getFileSize('ftp', filename);
            } catch (error) {
                expect(getMessageSpy).toHaveBeenCalledWith('unableToScanFTP');
            }
        });

        it('should corect call fetch', async () => {
            try {
                await scanFile.getFileSize('mock url');

                expect(mockFetch).toHaveBeenCalledWith('http://mock url', { method: 'HEAD' });
            } catch (error) {
                console.warn('Testing error', error);
            }
        });
    });

    it('should download a file', () => {
        const downloadSpy = jest.spyOn(chrome.downloads, 'download');

        scanFile.download(url, {}, filename);

        expect(downloadSpy).toHaveBeenCalledWith({ url, filename }, expect.any(Function));
    });

    it('should check if url is sanitezed', () => {
        expect.assertions(3);
        expect(scanFile.isSanitizedFile(url)).toEqual(undefined);
        expect(scanFile.isSanitizedFile(urlSafe)).toEqual(true);
        expect(scanFile.isSanitizedFile(urlMdcSafe)).toEqual(true);
    });

    it('should return correct scan status', () => {
        expect.assertions(4);
        expect(scanFile.getScanStatus(undefined)).toEqual(0);
        expect(scanFile.getScanStatus(0)).toEqual(1);
        expect(scanFile.getScanStatus(1)).toEqual(2);
        expect(scanFile.getScanStatus(10)).toEqual(3);
    });

    it('should return status label', () => {
        expect.assertions(2);

        scanFile.getScanStatusLabel();
        expect(getMessageSpy).toHaveBeenCalledWith('scanResult255');

        scanFile.getScanStatusLabel('Mock');
        expect(getMessageSpy).toHaveBeenCalledWith('scanResultMock');
    });

    it('should get getMd5Hash', async () => {
        try {
            await scanFile.getMd5Hash('data');
        } catch (error) {
            expect(getMessageSpy).toHaveBeenCalledWith('data');
        }
    });

    it('should get getFileData', async () => {
        const mockArrayBuffer = new ArrayBuffer(8);
        mockFetch.mockResolvedValueOnce({
            ok: true,
            arrayBuffer: () => Promise.resolve(mockArrayBuffer)
        });

        const url = 'http://example.com/file';
        await scanFile.getMd5Hash('data');
        const result = await scanFile.getFileData(url);

        expect(fetch).toHaveBeenCalledWith(url);
        expect(result).toBe(mockArrayBuffer);
    });

});
