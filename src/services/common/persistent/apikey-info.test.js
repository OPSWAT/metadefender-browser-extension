import BrowserStorage from '../../common/browser/browser-storage';
import { apikeyInfo } from './apikey-info';

describe('apikey-info', () => {
    const BrowserStorageGetSpy = jest.spyOn(BrowserStorage, 'get');
    const BrowserStorageSetSpy = jest.spyOn(BrowserStorage, 'set');

    const key = '/* @echo storageKey.apikey */';
    const initialData = {
        apikey: null,
        reputationLimit: null,
        preventionLimit: null,
        feedLimit: null,
        paidUser: null,
        limitInterval: 'Daily',
        maxUploadFileSize: null,
        sandboxLimit: null,
        loggedIn: false,
        organization: null,
    };

    const mockData = {
        apikey: 'mock',
        reputationLimit: 1000,
        preventionLimit: 100,
        feedLimit: 100,
        paidUser: false,
        limitInterval: 'Daily',
        maxUploadFileSize: 150,
        sandboxLimit: 5,
        loggedIn: true,
        organization: true,
    };

    const mclInfo = {
        limit_reputation: mockData.reputationLimit,
        limit_prevention: mockData.preventionLimit,
        limit_feed: mockData.feedLimit,
        paid_user: mockData.paidUser,
        time_interval: mockData.limitInterval,
        max_upload_file_size: mockData.maxUploadFileSize,
        limit_sandbox: mockData.sandboxLimit,
        organization: mockData.organization,
    };

    it('should init with save', (done) => {
        BrowserStorageGetSpy.mockImplementationOnce(() => undefined);

        apikeyInfo.init();

        setTimeout(() => {
            expect(BrowserStorageGetSpy).toHaveBeenCalledWith(key);
            expect(BrowserStorageSetSpy).toHaveBeenCalledWith({ [key]: { ...initialData } });
            done();
        });
    });

    it('should init with merge', (done) => {
        BrowserStorageGetSpy.mockImplementationOnce(() => ({ ...mockData }));

        apikeyInfo.init();

        expect(BrowserStorageGetSpy).toHaveBeenCalledWith(key);

        setTimeout(() => {
            for (let mockDataKey of Object.keys(mockData)) {
                expect(apikeyInfo[mockDataKey]).toEqual(mockData[mockDataKey]);
            }
            done();
        });
    });

    it('shoud load corect', (done) => {
        BrowserStorageGetSpy.mockImplementationOnce(() => ({ ...mockData }));

        setTimeout(async () => {
            const data = await apikeyInfo.load();
            expect(data).toEqual(mockData);
            done();
        });
    });

    it('should parse MCL info', () => {
        apikeyInfo.parseMclInfo(mclInfo);

        for (let mockDataKey of Object.keys(mockData)) {
            expect(apikeyInfo[mockDataKey]).toEqual(mockData[mockDataKey]);
        }
    });
});