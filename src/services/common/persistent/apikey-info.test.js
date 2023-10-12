import BrowserStorage from '../../common/browser/browser-storage';
import { apikeyInfo } from './apikey-info';
import MCL from '../../../config/config';

jest.mock('../../common/browser/browser-storage');
const storageKey = MCL?.config?.storageKey?.apikey;
describe('ApikeyInfo', () => {

    beforeEach(() => {
        BrowserStorage.get.mockClear();
        BrowserStorage.set.mockClear();
    });

    it('should initialize with default data', () => {
        const info = apikeyInfo;
        expect(info.data.apikey).toBe(null);
        expect(info.data.reputationLimit).toBe(null);
    });

    it('should save to browser storage', async () => {
        BrowserStorage.set.mockResolvedValue(true);

        const info = apikeyInfo;
        await info.save();

        expect(BrowserStorage.set).toBeCalledTimes(1);
    });

    it('should load from browser storage', async () => {
        const mockData = {
            apikey: 'mock-apikey',
        };

        BrowserStorage.get.mockResolvedValue({[storageKey]: mockData});

        const info = apikeyInfo;
        const loadedData = await info.load();

        expect(BrowserStorage.get).toBeCalledTimes(1);
        expect(loadedData).toEqual(mockData);
    });

    it('should merge new data correctly', () => {
        const info = apikeyInfo;
        const newData = {
            apikey: 'new-apikey',
            reputationLimit: 5,
        };
        
        info.merge(newData);

        expect(info.data.apikey).toBe('new-apikey');
        expect(info.data.reputationLimit).toBe(5);
    });

    it('should initialize with default data if browser storage is empty', async () => {
        BrowserStorage.get.mockResolvedValue(null);

        const info = apikeyInfo;
        await info.init();

        expect(BrowserStorage.get).toBeCalledTimes(1);
        expect(info.data.apikey).toBe('new-apikey');
    });

    it('should initialize with data from browser storage if available', async () => {
        const mockData = {
            apikey: 'existing-apikey',
            reputationLimit: 10,
        };
        BrowserStorage.get.mockResolvedValue({[storageKey]: mockData});

        const info = apikeyInfo;
        await info.init();

        expect(BrowserStorage.get).toBeCalledTimes(1);
        expect(info.data.apikey).toBe('existing-apikey');
        expect(info.data.reputationLimit).toBe(10);
    });

    it('should parse MclInfo correctly', () => {
        const mclInfoMock = {
            limit_reputation: 5,
            limit_prevention: 10,
            limit_feed: 15,
            paid_user: true,
            time_interval: 'Weekly',
            max_upload_file_size: 2048,
            limit_sandbox: 3,
            organization: 'MockOrg'
        };

        const info = apikeyInfo;
        info.parseMclInfo(mclInfoMock);

        expect(info.data.reputationLimit).toBe(5);
        expect(info.data.preventionLimit).toBe(10);
        expect(info.data.feedLimit).toBe(15);
        expect(info.data.paidUser).toBe(true);
        expect(info.data.limitInterval).toBe('Weekly');
        expect(info.data.maxUploadFileSize).toBe(2048);
        expect(info.data.sandboxLimit).toBe(3);
        expect(info.data.organization).toBe('MockOrg');
    });


});