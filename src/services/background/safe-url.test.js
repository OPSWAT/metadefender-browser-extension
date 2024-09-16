import safeUrl from './safe-url';

const mockFetch = jest.fn();
const mockUpdate = jest.fn();
const mockAddListener = jest.fn();
const mockRemoveListener = jest.fn();

global.fetch = mockFetch;

window.chrome = {
    tabs: {
        onUpdated: {
            addListener: mockAddListener,
            removeListener: mockRemoveListener
        },
        update: mockUpdate
    }
};

jest.mock('../common/persistent/settings', () => ({
    settings: {
        load: jest.fn(),
        data: { useWhiteList: false, whiteListCustom: [] }
    }
}));

const MCL = {
    config: {
        mclDomain: 'https://mocked-mcl-domain.com'
    }
};

describe('safe-url', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        mockUpdate.mockReset();
        mockAddListener.mockReset();
        mockRemoveListener.mockReset();
        require('../common/persistent/settings').settings.load.mockReset();
        safeUrl.enabled = false;
    });

    it('should have correct defaults', () => {
        expect(safeUrl.enabled).toBe(false);
    });

    it('should not toggle because of the same value', async () => {
        const response = await safeUrl.toggle(false);

        expect(response).toBe(undefined);
        expect(safeUrl.enabled).toBe(false);
    });

    it('should toggle to true and add listener', async () => {
        const response = await safeUrl.toggle(true);

        expect(response).toBe(true);
        expect(safeUrl.enabled).toBe(true);
        expect(mockAddListener).toHaveBeenCalled();
    });

    it('should toggle to false and remove listener', async () => {
        safeUrl.enabled = true;
        const response = await safeUrl.toggle(false);

        expect(response).toBe(false);
        expect(safeUrl.enabled).toBe(false);
        expect(mockRemoveListener).toHaveBeenCalled();
    });

    it('should initialize with loaded settings', async () => {
        require('../common/persistent/settings').settings.load.mockResolvedValue({ safeUrl: true });

        await safeUrl.init();

        expect(safeUrl.enabled).toBe(true);
        expect(mockAddListener).toHaveBeenCalled();
    });

    it('should initialize with loaded settings and remain disabled', async () => {
        require('../common/persistent/settings').settings.load.mockResolvedValue({ safeUrl: false });
        await safeUrl.init();

        expect(safeUrl.enabled).toBe(false);
        expect(mockRemoveListener).not.toHaveBeenCalled();
    });

    it('should call doSafeRedirect for a non-safe url when listener is triggered', async () => {
        const tabId = 1;
        const changeInfo = { status: 'loading' };
        const tab = { url: 'http://example.com/path' };
        mockFetch.mockResolvedValue({ status: 200 });
        await safeUrl.toggle(true);

        expect(mockAddListener).toHaveBeenCalled();
        const listener = mockAddListener.mock.calls[0][0];
        await listener(tabId, changeInfo, tab);

        expect(mockFetch).toHaveBeenCalled();
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should redirect an infected url when listener is triggered', async () => {
        const tabId = 1;
        const changeInfo = { status: 'loading' };
        const tab = { url: 'http://infected.com/path' };
        mockFetch.mockResolvedValue({ status: 400 });
        await safeUrl.toggle(true);
        expect(mockAddListener).toHaveBeenCalled();
        const listener = mockAddListener.mock.calls[0][0];
        await listener(tabId, changeInfo, tab);
        expect(mockUpdate).toHaveBeenCalledWith(tabId, { url: `/* @echo mclDomain *//safe-redirect/http%3A%2F%2Finfected.com%2Fpath` });
    });

});
