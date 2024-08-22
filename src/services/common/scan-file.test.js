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
    const file = new Blob(['This is some file content'], { type: 'text/plain' });

    beforeEach(() => {
        mockFetch.mockImplementation(() => Promise.resolve({ json: () => Promise.resolve(), url: 'mockUrl', headers: { get: () => 200 } }));
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
        // Mock the arrayBuffer method to simulate the browser environment
        Blob.prototype.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(8));

        const fileHash = await scanFile.getMd5Hash(file);

        expect(typeof fileHash).toBe('string');
        expect(fileHash).toEqual(fileHash.toUpperCase());

        Blob.prototype.arrayBuffer.mockRestore();
    });

    it('should get getFileData', async () => {
        const mockResponse = new Response(file);
        jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

        const url = 'http://example.com/file';
        const result = await scanFile.getFileData(url);

        expect(fetch).toHaveBeenCalledWith(url);
        expect(result).toBe(file);
    });
});
