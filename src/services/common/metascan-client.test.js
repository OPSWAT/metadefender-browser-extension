import MetascanClient from './metascan-client';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('metascan-client', () => {
    const hash = 'mock-hash';
    const apikey = 'mock-apikey';

    beforeEach(() => {
        mockFetch.mockImplementationOnce(() => Promise.resolve({ json: () => Promise.resolve({ sanitized: { file_path: 'mock' }, scan_result: { progress_percentage: 100 } }) }));
    });

    it('should call correct for apikey', (done) => {
        MetascanClient.apikey.info(apikey);

        setTimeout(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                '/* @echo metadefenderDomain *///* @echo metadefenderVersion *//apikey',
                { headers: { apikey } },
            );

            done();
        }, 0);
    });

    it('should call correct hash lookup', (done) => {
        MetascanClient.hash.lookup(hash);

        setTimeout(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                '/* @echo metadefenderDomain *///* @echo metadefenderVersion *//hash/mock-hash',
                { headers: { apikey: null } },
            );

            done();
        }, 0);
    });

    it('should call correct file upload', (done) => {
        MetascanClient.file.upload({
            fileName: 'mock',
            fileData: { mock: {} },
            sampleSharing: true,
            password: 'mock-password',
            canBeSanitized: true
        });

        setTimeout(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                '/* @echo metadefenderDomain *///* @echo metadefenderVersion *//file',
                {
                    method: 'POST',
                    body: { mock: {} },
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        apikey: null,
                        'samplesharing': 1,
                        'filename': 'mock',
                        'rule': 'unarchive,sanitize',
                        'x-source': 'chrome_extension',
                        'archivepwd': 'mock-password'
                    },
                },
            );

            done();
        }, 0);
    });

    it('should call correct file lookup', (done) => {
        MetascanClient.file.lookup('mock');

        setTimeout(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                '/* @echo metadefenderDomain *///* @echo metadefenderVersion *//file/mock',
                { headers: { apikey: null, 'x-file-metadata': 1 } },
            );

            done();
        }, 0);
    });
});