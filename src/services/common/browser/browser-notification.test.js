import { settings } from './../persistent/settings';
import browserNotification from './browser-notification';

global.chrome = {
    i18n: {
        getMessage: jest.fn(),
    },
    notifications: {
        create: jest.fn(),
        clear: jest.fn(),
    }
};

// Mock the settings object
jest.mock('./../persistent/settings', () => ({
    settings: {
        load: jest.fn(),
    },
}));


describe('browserNotification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a notification with default icon', async () => {
        settings.load.mockResolvedValue({ showNotifications: true });
        chrome.i18n.getMessage.mockReturnValue('mocked_appName');

        await browserNotification.create('test message');

        expect(chrome.notifications.create).toHaveBeenCalledWith(expect.objectContaining({
            iconUrl: '/images/ext-notification.png',
            message: 'test message'
        }), expect.any(Function));
    });

    it('should create a notification with clean icon when file is not infected', async () => {
        settings.load.mockResolvedValue({ showNotifications: true });

        await browserNotification.create('test message', undefined, false);

        expect(chrome.notifications.create).toHaveBeenCalledWith(expect.objectContaining({
            iconUrl: '/images/ext-notification-clean.png',
            message: 'test message'
        }), expect.any(Function));
    });

    it('should create a notification with infected icon when file is infected', async () => {
        settings.load.mockResolvedValue({ showNotifications: true });

        await browserNotification.create('test message', undefined, true);

        expect(chrome.notifications.create).toHaveBeenCalledWith(expect.objectContaining({
            iconUrl: '/images/ext-notification-infected.png',
            message: 'test message'
        }), expect.any(Function));
    });

    it('should not create a notification if showNotifications is false', async () => {
        settings.load.mockResolvedValue({ showNotifications: false });

        await browserNotification.create('test message');

        expect(chrome.notifications.create).not.toHaveBeenCalled();
    });

    xit('should handle error during notification creation', async () => {
        settings.load.mockResolvedValue({ showNotifications: true });
        chrome.notifications.create.mockImplementationOnce(() => {
            throw new Error('mocked error');
        });

        await browserNotification.create('test message');
    });
});