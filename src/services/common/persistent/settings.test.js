import BrowserStorage from '../../common/browser/browser-storage';
import { settings } from './settings';

describe('settings', () => {
    const BrowserStorageGetSpy = jest.spyOn(BrowserStorage, 'get');
    const BrowserStorageSetSpy = jest.spyOn(BrowserStorage, 'set');

    const key = '/* @echo storageKey.settings */';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should load settings from BrowserStorage', async () => {
        const storedSettings = { [key]: { scanDownloads: true, showNotifications: false } };
        BrowserStorageGetSpy.mockResolvedValueOnce(storedSettings);

        const result = await settings.load();

        expect(BrowserStorageGetSpy).toHaveBeenCalledWith(key);
        expect(result).toEqual(storedSettings[key]);
        expect(settings.data.scanDownloads).toBe(true);
        expect(settings.data.showNotifications).toBe(false);
    });

    it('should merge new settings correctly', () => {
        const newSettings = { scanDownloads: true, coreUrl: 'http://newurl.com' };

        settings.merge(newSettings);

        expect(settings.data.scanDownloads).toBe(true);
        expect(settings.data.coreUrl).toBe('http://newurl.com');
        expect(settings.data.shareResults).toBe(true); // Unchanged default value
    });

    it('should save current settings to BrowserStorage', async () => {
        settings.data.scanDownloads = true;

        await settings.save();

        expect(BrowserStorageSetSpy).toHaveBeenCalledWith({ [key]: settings.data });
    });

    it('should return the current settings', () => {
        const currentSettings = settings.get();

        expect(currentSettings).toEqual(settings.data);
    });

    it('should handle missing settings gracefully during load', async () => {
        BrowserStorageGetSpy.mockResolvedValueOnce(null);

        const result = await settings.load();

        expect(result).toBeNull();
        expect(BrowserStorageGetSpy).toHaveBeenCalledWith(key);
    });
});
