import MetascanClient from '../common/metascan-client';
import MCL from '../../config/config';
import { apikeyInfo } from '../common/persistent/apikey-info';
import { settings } from '../common/persistent/settings';
import BackgroundTask from './background-task';
import cookieManager from './cookie-manager';
import { scanHistory } from '../common/persistent/scan-history';
import SafeUrl from './safe-url';
import { waitFor } from '@testing-library/react';

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
        local: { get: () => null },
        onChanged: {
            addListener: () => null,
            removeListener: () => null
        }
    },
    downloads: {
        onCreated: { addListener: jest.fn() },
        onChanged: { addListener: jest.fn() },
    },
    notifications: {
        onClicked: { addListener: jest.fn() },
        onClosed: { addListener: jest.fn() }
    },
    i18n: {
        getMessage: (msg) => msg
    }
};

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

    it('should create two new tabs on extension install', () => {
        backgroundTask.onInstallExtensionListener({ reason: 'install' });

        expect(mockCreate).toHaveBeenCalledTimes(2);
    });


    describe('handleContextMenuClicks', () => {
        it('should do nothing', async () => {
            await backgroundTask.handleContextMenuClicks({ menuItemId: 'any' });

            expect(mockRemoveListener).toHaveBeenCalledTimes(0);
        });

    });

    xit('should initialize class correctly', async () => {
        await waitFor(() => backgroundTask.init());

        expect(settingsInitSpy).toHaveBeenCalled();
        expect(apikeyInitSpy).toHaveBeenCalled();
        expect(scanHistoryInitSpy).toHaveBeenCalled();
        expect(scanHistoryCleanSpy).toHaveBeenCalled();
        expect(safeUrlToggleSpy).toHaveBeenCalledWith(false);
        expect(onChangeSpy).toHaveBeenCalled();
    });

    it('should create two new tabs on extension install', () => {
        backgroundTask.onInstallExtensionListener({ reason: 'install' });

        expect(mockCreate).toHaveBeenCalledTimes(2);
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

});
