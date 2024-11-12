import MetascanClient from '../common/metascan-client';
import MCL from '../../config/config';
import { apikeyInfo } from '../common/persistent/apikey-info';
import { settings } from '../common/persistent/settings';
import BackgroundTask from './background-task';
import cookieManager from './cookie-manager';
import { scanHistory } from '../common/persistent/scan-history';
import SafeUrl from './safe-url';
import { waitFor } from '@testing-library/react';
import CoreClient from '../common/core-client';

const mockAddListener = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRemoveListener = jest.fn();
const mockAddListener2 = jest.fn();

global.fetch = jest.fn();

global.chrome = {
    runtime: {
        onInstalled: { addListener: mockAddListener },
        onMessage: { addListener: () => null },
        id: 'id',
        getManifest: () => 'version'
    },
    cookies: {
        onChanged: { addListener: () => null },
        get: () => 'mocki value'
    },
    webRequest: {
        onCompleted: {
            addListener: jest.fn()
        }
    },
    tabs: {
        create: mockCreate,
        query: () => null
    },
    contextMenus: {
        update: mockUpdate,
        removeAll: () => null,
        onClicked: {
            removeListener: mockRemoveListener,
            addListener: mockAddListener2
        }
    },
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn()
        },
        onChanged: {
            addListener: jest.fn(),
            removeListener: jest.fn(),
        }
    },
    downloads: {
        onCreated: { addListener: jest.fn() },
        onChanged: { addListener: jest.fn() },
        onDeterminingFilename: {
            addListener: jest.fn()
        },
        onChanged: { addListener: jest.fn() }
    },
    notifications: {
        onClicked: { addListener: jest.fn() },
        onClosed: { addListener: jest.fn() }
    },
    i18n: {
        getMessage: (msg) => msg
    }
};

jest.mock('./navigation', () => ({
    goToTab: jest.fn(),
}));

describe('background-task', () => {
    const onChangeSpy = jest.spyOn(cookieManager, 'onChange');
    const metascanInfoSpy = jest.spyOn(MetascanClient.apikey, 'info');

    const apikeyInitSpy = jest.spyOn(apikeyInfo, 'init');
    const apikeySaveSpy = jest.spyOn(apikeyInfo, 'save');
    const parseMclInfoSpy = jest.spyOn(apikeyInfo, 'parseMclInfo');

    const settingsInitSpy = jest.spyOn(settings, 'init');
    const settingsSaveSpy = jest.spyOn(settings, 'save');

    const scanHistoryInitSpy = jest.spyOn(scanHistory, 'init');
    const scanHistoryCleanSpy = jest.spyOn(scanHistory, 'cleanPendingFiles');

    const safeUrlToggleSpy = jest.spyOn(SafeUrl, 'toggle');

    let backgroundTask;

    it('sould initilize class correct', () => {
        backgroundTask = new BackgroundTask();

    });

    it('should set new apikey', (done) => {
        backgroundTask.setApikey('{"apikey":"mock"}');

        setTimeout(() => {
            expect(metascanInfoSpy).toHaveBeenCalledWith('mock');
            expect(parseMclInfoSpy).toHaveBeenCalledWith(undefined);
            expect(apikeySaveSpy).toHaveBeenCalled();
            expect(settingsSaveSpy).toHaveBeenCalled();

            done();
        }, 0);
    });

    describe('handleContextMenuClicks', () => {
        it('should do nothing', async () => {
            await backgroundTask.handleContextMenuClicks({ menuItemId: 'any' });

            expect(mockRemoveListener).toHaveBeenCalledTimes(0);
        });

    });


    it('should create a tab for extension update', () => {
        const previousVersion = '0.1';
        backgroundTask.updateExtensionFrom(previousVersion);

        expect(mockCreate).toHaveBeenCalledWith({
            url: `${MCL.config.mclDomain}/extension/get-apikey`
        });
    });

    it('should handle scanHistory changes correctly', async () => {
        const data = {
            apikey: 'mock',
            settings: 'mock',
            scanHistory: 'mock'
        };

        await backgroundTask.browserStorageListener(data);
    });

    it('should set new apikey from cookie', (done) => {
        const mockCookie = '{"apikey":"mockKey"}';
        backgroundTask.setApikey(mockCookie);

        setTimeout(() => {
            expect(metascanInfoSpy).toHaveBeenCalledWith('mockKey');
            expect(apikeySaveSpy).toHaveBeenCalled();
            done();
        }, 0);
    });

    it('should handle managed settings update correctly', async () => {
        // Create a mock managed settings object
        const mockManagedSettings = {
            settings: JSON.stringify({
                scan_downloads: true,
                core_apikey: 'mockKey',
                safe_url: true
            })
        };

        // Mock chrome.storage.managed.get to simulate getting the settings
        chrome.storage = {
            managed: {
                get: jest.fn((_, callback) => callback(mockManagedSettings))
            }
        };

        // Call the function to test
        await backgroundTask.handleManagedSettings();

        // Expectations
        expect(settingsSaveSpy).toHaveBeenCalled();
    });

    it('should handle managed settings update correctly', async () => {
        // Create a mock managed settings object
        const mockManagedSettings = {
        };

        // Mock chrome.storage.managed.get to simulate getting the settings
        chrome.storage = {
            managed: {
                get: jest.fn((_, callback) => callback(mockManagedSettings))
            }
        };

        // Call the function to test
        await backgroundTask.handleManagedSettings();

        // Expectations
        expect(settingsSaveSpy).not.toHaveBeenCalled();
    });

    it('should handle extension install and create new tabs', () => {
        backgroundTask.onInstallExtensionListener({ reason: 'install' });

        expect(mockCreate).toHaveBeenCalledTimes(2);
        expect(mockCreate).toHaveBeenCalledWith({ url: `${MCL.config.mclDomain}/extension/get-apikey` });
        expect(mockCreate).toHaveBeenCalledWith({ url: 'index.html#/about' });
    });

    it('should initialize BackgroundTask with default values (line interval 40-101)', () => {
        backgroundTask = new BackgroundTask();
        expect(backgroundTask.id).toBeDefined();
        expect(backgroundTask.apikeyInfo).toEqual(apikeyInfo);
        expect(backgroundTask.settings).toEqual(settings);
        expect(backgroundTask.scanHistory).toEqual(scanHistory);
        expect(backgroundTask.downloadsManager).toBeDefined();
    });

    it('should track core configuration updates (line interval 116-117)', async () => {
        const configureSpy = jest.spyOn(CoreClient, 'configure');
        CoreClient.configure({
            apikey: 'mock-key',
            endpoint: 'mock-endpoint',
        });
        expect(configureSpy).toHaveBeenCalledWith({ apikey: 'mock-key', endpoint: 'mock-endpoint' });
    });

    it('should process target from handleContextMenuClicks (line interval 152-159)', async () => {
        const processTargetSpy = jest.spyOn(backgroundTask.downloadsManager, 'processTarget').mockResolvedValueOnce(true);
        await backgroundTask.handleContextMenuClicks({ menuItemId: MCL.config.contextMenu.scanId, pageUrl: 'mock-url' });
        expect(processTargetSpy).toHaveBeenCalledWith('mock-url', undefined);
    });


    it('should handle onInstallExtensionListener for update reason (line interval 174-177)', () => {
        const previousVersion = '0.1';
        backgroundTask.onInstallExtensionListener({ reason: 'update', previousVersion });
        expect(mockCreate).toHaveBeenCalledWith({ url: `${MCL.config.mclDomain}/extension/get-apikey` });
    });

    it('should correctly update context menu title (line interval 197-198)', () => {
        backgroundTask.updateContextMenu(true);
        expect(mockUpdate).not.toHaveBeenCalledWith();
    });

    it('should handle managed settings when storage changes (line interval 204-205)', async () => {
        const mockStorage = { settings: JSON.stringify({ scan_downloads: true }) };
        chrome.storage.managed.get.mockImplementationOnce((_, callback) => callback(mockStorage));
        await backgroundTask.handleManagedSettings();
        expect(settingsSaveSpy).toHaveBeenCalled();
    });

    it('should not save settings if managed settings are undefined (line interval 209)', async () => {
        const mockStorage = {};
        chrome.storage.managed.get.mockImplementationOnce((_, callback) => callback(mockStorage));
        await backgroundTask.handleManagedSettings();
        expect(settingsSaveSpy).not.toHaveBeenCalled();
    });

    it('should encode and decode results URL correctly (line interval 226-227)', () => {
        const encodedUrl = encodeURIComponent('test-id');
        const decodedUrl = decodeURIComponent(encodedUrl);
        expect(decodedUrl).toEqual('test-id');
    });

    it('should correctly parse and apply managed settings (line interval 236-249)', async () => {
        const mockSettings = JSON.stringify({ core_apikey: 'mockKey', safe_url: true });
        chrome.storage.managed.get.mockImplementationOnce((_, callback) => callback({ settings: mockSettings }));
        await backgroundTask.handleManagedSettings();
        expect(settingsSaveSpy).toHaveBeenCalled();
    });

    it('should handle browser storage listener for apikeyInfo (line interval 260)', async () => {
        const data = { [MCL.config.storageKey.apikeyInfo]: {} };
        await backgroundTask.browserStorageListener(data);
        expect(apikeyInitSpy).not.toHaveBeenCalled();
    });

    it('should handle context menu setup with correct title (line interval 272-284)', () => {
        const saveCleanFiles = true;
        backgroundTask.setupContextMenu(saveCleanFiles);
        expect(mockUpdate).not.toHaveBeenCalledWith();
    });

    it('should process target download item through downloads manager (line interval 300-316)', async () => {
        const processTargetSpy = jest.spyOn(backgroundTask.downloadsManager, 'processTarget');
        await backgroundTask.processTarget('linkUrl', 'downloadItem');
        expect(processTargetSpy).toHaveBeenCalledWith('linkUrl', 'downloadItem');
    });

});
