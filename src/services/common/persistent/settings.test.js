import BrowserStorage from '../../common/browser/browser-storage';
import { settings } from './settings';


describe('settings', () => {
    const BrowserStorageGetSpy = jest.spyOn(BrowserStorage, 'get');
    const BrowserStorageSetSpy = jest.spyOn(BrowserStorage, 'set');

    const key = '/* @echo storageKey.settings */';

    const initialData = {
        scanDownloads: false,
        shareResults: true,
        showNotifications: true,
        saveCleanFiles: false,
        safeUrl: false,
        useCore: false,
        coreUrl: '',
        coreApikey: '',
        coreRule: '',
        coreV4: false,
        rules: []
    };

    it('should init with save', (done) => {
        BrowserStorageGetSpy.mockImplementationOnce(() => ({}));

        settings.init();

        setTimeout(() => {
            expect(BrowserStorageGetSpy).toHaveBeenCalledWith(key);
            expect(BrowserStorageSetSpy).toHaveBeenCalledWith({ [key]: initialData });

            done();
        }, 0);
    });

    it('should load settings', (done) => {
        settings.load();

        setTimeout(() => {
            expect(BrowserStorageGetSpy).toHaveBeenCalledWith(key);

            done();
        }, 0);
    });
});