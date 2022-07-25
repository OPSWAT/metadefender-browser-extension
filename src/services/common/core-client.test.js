import * as API from './callAPI';
import CoreClient from './core-client';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('core-client', () => {
    const callAPISpy = jest.spyOn(API, 'callAPI');

    beforeEach(() => {
        mockFetch.mockImplementation(() => Promise.resolve({ json: () => Promise.resolve() }));
    });

    it('should call for upload file correct', (done) => {
        CoreClient.file.upload({ fileData: { mock: 'mock file data' }, fileName: 'mock file name' });

        setTimeout(() => {
            expect(callAPISpy).toHaveBeenCalledWith(
                'null/file',
                {
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'apikey': null,
                        'user_agent': 'chrome_extension',
                        'filename': 'mock file name'
                    },
                    body: {
                        mock: 'mock file data'
                    }
                },
                'post'
            );

            done();
        }, 0);
    });

    it('should call for file lookup', (done) => {
        CoreClient.file.lookup('mock-dataId');

        setTimeout(() => {
            expect(callAPISpy).toHaveBeenCalledWith(
                'null/file/mock-dataId',
                { headers: { 'apikey': null, } },
            );

            done();
        }, 0);
    });

    it('should pool call for result', (done) => {
        callAPISpy.mockImplementationOnce(() => ({
            sanitized: {
                file_path: 'mock-dataId'
            }
        }));

        CoreClient.file.poolForResults('mock-dataId', 50);

        setTimeout(() => {
            expect(callAPISpy).toHaveBeenCalledWith(
                'null/file/mock-dataId',
                { headers: { apikey: null } }
            );

            done();
        }, 0);
    });

    it('should call for sanitize', (done) => {
        CoreClient.file.checkSanitized('mock-download-url');

        setTimeout(() => {
            expect(mockFetch).toHaveBeenCalledWith('mock-download-url');
            done();
        });
    });

    it('should call for hash lookup', (done) => {
        CoreClient.hash.lookup('mock-hash');

        setTimeout(() => {
            expect(callAPISpy).toHaveBeenCalledWith(
                'null/hash/mock-hash',
                { headers: { 'apikey': null, } },
            );

            done();
        }, 0);
    });

    it('should call for version', (done) => {
        CoreClient.version();

        setTimeout(() => {
            expect(callAPISpy).toHaveBeenCalledWith(
                'null/version',
                { headers: { 'apikey': null, } },
            );

            done();
        }, 0);
    });

    it('should call for rules', (done) => {
        CoreClient.rules();

        setTimeout(() => {
            expect(callAPISpy).toHaveBeenCalledWith(
                'null/file/rules',
                { headers: { 'apikey': null, } },
            );

            done();
        }, 0);
    });
});