import MetascanClient from '../common/metascan-client';
import { apikeyInfo } from '../common/persistent/apikey-info';
import { settings } from '../common/persistent/settings';
import BackgroundTask from './background-task';
import cookieManager from './cookie-manager';
import { scanHistory } from '../common/persistent/scan-history';

const mockAddListener = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRemoveListener = jest.fn();

global.fetch = jest.fn();

global.chrome = {
    runtime: {
        onInstalled: { addListener: mockAddListener },
        onMessage: { addListener: () => null }
    },
    cookies: {
        onChanged: { addListener: () => null },
        get: jest.fn()
    },
    tabs: {
        create: mockCreate
    },
    contextMenus: {
        update: mockUpdate,
        removeAll: () => null,
        onClicked: {
            removeListener: mockRemoveListener
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

    let backgroundTask;

    it('sould initilize class correct', () => {
        backgroundTask = new BackgroundTask();

        expect(onChangeSpy).toHaveBeenCalled();
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


    it('should call init correct', (done) => {
        backgroundTask.init();

        setTimeout(() => {
            expect(settingsInitSpy).toHaveBeenCalled();
            expect(apikeyInitSpy).toHaveBeenCalled();
            expect(scanHistoryInitSpy).toHaveBeenCalled();
            expect(scanHistoryCleanSpy).toHaveBeenCalled();

            done();
        }, 0);
    });

    it('should handle context menu update', () => {
        backgroundTask.updateContextMenu(true);
        expect(mockUpdate).toHaveBeenCalledWith('/* @echo contextMenu.scanId */', { title: 'contextMenuScanAndDownloadTitle' });

        backgroundTask.updateContextMenu(false);
        expect(mockUpdate).toHaveBeenCalledWith('/* @echo contextMenu.scanId */', { title: 'contextMenuScanTitle' });
    });


    describe('handleContextMenuClicks', () => {
        it('should do nothing', async () => {
            await backgroundTask.handleContextMenuClicks({ menuItemId: 'any' });

            expect(mockRemoveListener).toHaveBeenCalledTimes(0);
        });


        it('should handle context menu click', async () => {
            await backgroundTask.handleContextMenuClicks({ menuItemId: '/* @echo contextMenu.scanId */', srcUrl: 'mock' });

            expect(mockRemoveListener).toHaveBeenCalled();
        });
    });
});