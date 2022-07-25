import { settings } from './../persistent/settings';
import browserNotification from './browser-notification';

const mockClear = jest.fn();
const mockCreate = jest.fn();

global.chrome = {
    notifications: {
        create: mockCreate,
        clear: mockClear
    },
    i18n: {
        getMessage: (str) => str
    }
};

jest.mock('../../../config/config', () => ({
    config: { browserNotificationTimeout: 10 }
}));

describe('browser-notification', () => {
    const loadSpy = jest.spyOn(settings, 'load');

    it('should create notification', (done) => {
        const message = 'mock message';

        browserNotification.create(message);

        setTimeout(() => {
            expect(loadSpy).toHaveBeenCalled();
            expect(mockCreate).toHaveBeenCalledWith(
                {
                    type: 'basic',
                    iconUrl: '/images/ext-notification.png',
                    title: 'appName',
                    message,
                    priority: 1,
                    isClickable: false
                },
                expect.any(Function)
            );

            done();
        }, 0);
    });

    it('should creat notifications', (done) => {
        mockCreate.mockImplementation((obj, cb) => cb('mock'));

        browserNotification.create();

        setTimeout(() => {
            expect(mockClear).toHaveBeenCalledWith('mock');

            done();
        }, 20);
    });
});