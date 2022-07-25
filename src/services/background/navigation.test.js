import { goToTab } from './navigation';

const aboutUrl = 'chrome-extension://mockId/index.html#/about';
const historyUrl = 'chrome-extension://mockId/index.html#/history';

const mockUpdate = jest.fn();
const mockCreate = jest.fn();

global.chrome = {
    runtime: { id: 'mockId' },
    i18n: { getMessage: (string) => string },
    tabs: {
        query: (_, cb) => cb([]),
        update: mockUpdate,
        create: mockCreate
    }
};

describe('navigation', () => {
    it('should create new tab', () => {
        goToTab('about');

        expect(mockCreate).toHaveBeenCalledWith({
            active: true,
            url: aboutUrl
        });
    });

    it('should update current tab', () => {
        global.chrome.tabs.query = (_, cb) => cb([{ url: aboutUrl }]);

        goToTab('about');

        expect(mockUpdate).toHaveBeenCalledWith(undefined, { active: true });
    });

    it('should update current tab with new url', () => {
        global.chrome.tabs.query = (_, cb) => cb([{ url: aboutUrl }]);

        goToTab('history');

        expect(mockUpdate).toHaveBeenCalledWith(undefined, { active: true, url: historyUrl });
    });
});