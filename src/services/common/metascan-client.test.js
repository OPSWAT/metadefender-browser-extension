import MetascanClient from './metascan-client';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('metascan-client', () => {
    const hash = 'mock-hash';
    const apikey = 'mock-apikey';

    // Mock the methods
    beforeAll(() => {
        jest.spyOn(MetascanClient, 'setAuth').mockImplementation(jest.fn());
        jest.spyOn(MetascanClient, 'setHost').mockImplementation(jest.fn());
        jest.spyOn(MetascanClient, 'setVersion').mockImplementation(jest.fn());
    });

    beforeEach(() => {
        mockFetch.mockImplementationOnce(() =>
            Promise.resolve({
                json: () => Promise.resolve({
                    sanitized: { file_path: 'mock' },
                    scan_result: { progress_percentage: 100 }
                })
            })
        );
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
                {
                    headers: { apikey: null },
                    method: 'GET',
                },
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

    it('should configure the client correctly', () => {
        const config = {
            restApikey: apikey,
            restHost: 'mock-host',
            restVersion: 'v4',
            pollingMaxInterval: 5000,
            pollingIncrementor: 1
        };

        MetascanClient.configure(config);

        setTimeout(() => {
            console.log(MetascanClient.config);
            expect(MetascanClient.config?.pollingMaxInterval).toBe(5000);
            expect(MetascanClient.config?.pollingIncrementor).toBe(1);
            expect(MetascanClient.setVersion).toHaveBeenCalledWith('v4');
            expect(MetascanClient.setHost).toHaveBeenCalledWith('mock-host');
            expect(MetascanClient.setAuth).toHaveBeenCalledWith(apikey);
        }, 1000);
    });

});