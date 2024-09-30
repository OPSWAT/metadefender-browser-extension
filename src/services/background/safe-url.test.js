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
});
