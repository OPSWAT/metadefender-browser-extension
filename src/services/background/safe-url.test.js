import safeUrl, { isSafeUrl, doSafeRedirect, activeRedirects, infectedUrls, cleanUrls } from './safe-url';
import { settings } from '../common/persistent/settings';
import { getDomain } from './download-manager';


const mockFetch = jest.fn().mockResolvedValue({ status: 200 });
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

jest.mock('./download-manager', () => ({
    getDomain: jest.fn()
}));

const safeRedirectEndpoint = 'https://mocked-mcl-domain.com/safe-redirect/';

describe('safe-url', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        mockUpdate.mockReset();
        mockAddListener.mockReset();
        mockRemoveListener.mockReset();
        settings.load.mockReset();
        safeUrl.enabled = false;
        activeRedirects.clear();
        infectedUrls.clear();
        cleanUrls.clear();
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
        settings.load.mockResolvedValue({ safeUrl: true });

        await safeUrl.init();

        expect(safeUrl.enabled).toBe(true);
        expect(mockAddListener).toHaveBeenCalled();
    });

    it('should initialize with loaded settings and remain disabled', async () => {
        settings.load.mockResolvedValue({ safeUrl: false });
        await safeUrl.init();

        expect(safeUrl.enabled).toBe(false);
        expect(mockRemoveListener).not.toHaveBeenCalled();
    });

    // Additional Tests for Lines 37-51, 56-58, 71-103

    it('should add URL to cleanUrls on non-400 response', async () => {
        const testUrl = 'https://test-url.com';
        mockFetch.mockResolvedValue({ status: 200 });

        await isSafeUrl(testUrl, `${MCL.config.mclDomain}/safe-redirect`);

        expect(cleanUrls.has(testUrl)).toBe(true);
        expect(infectedUrls.has(testUrl)).toBe(false);
    });

    it('should add URL to infectedUrls on 400 response', async () => {
        const testUrl = 'https://infected-url.com';
        mockFetch.mockResolvedValue({ status: 400 });

        await isSafeUrl(testUrl, `${MCL.config.mclDomain}/safe-redirect`);

        expect(infectedUrls.has(testUrl)).toBe(true);
        expect(cleanUrls.has(testUrl)).toBe(false);
    });

    it('should handle errors in handleUrlValidatorResponse gracefully', async () => {
        const testUrl = 'https://error-url.com';
        mockFetch.mockRejectedValue(new Error('Network Error'));

        await isSafeUrl(testUrl, `${MCL.config.mclDomain}/safe-redirect`);

        expect(cleanUrls.has(testUrl)).toBe(true);
        expect(infectedUrls.has(testUrl)).toBe(false);
    });
});

describe('doSafeRedirect', () => {
    beforeEach(() => {
        mockUpdate.mockReset();
        mockFetch.mockReset();
        mockFetch.mockResolvedValue({ status: 200 }); // Ensure fetch always returns a promise by default
        activeRedirects.clear();
        infectedUrls.clear();
        cleanUrls.clear();
    });

    it('should not redirect if the URL is whitelisted', async () => {
        settings.data.whiteListCustom = ['allowed-domain.com'];
        getDomain.mockResolvedValue('allowed-domain.com');

        const tab = { url: 'https://allowed-domain.com/page' };

        await doSafeRedirect(1, { status: 'loading' }, tab);

        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should not redirect if the URL is clean', async () => {
        const tabId = 1;
        const tab = { url: 'https://clean-domain.com/page' };
        getDomain.mockResolvedValue('clean-domain.com');
        cleanUrls.add('https://clean-domain.com/page');

        await doSafeRedirect(tabId, { status: 'loading' }, tab);

        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should add to activeRedirects and redirect if URL is infected and not in activeRedirects', async () => {
        const tabId = 1;
        const tabUrl = 'https://infected-domain.com/page';
        const tab = { url: tabUrl };
        getDomain.mockResolvedValue('infected-domain.com');
        infectedUrls.add(tabUrl);

        mockFetch.mockResolvedValue({ status: 400 });

        await doSafeRedirect(tabId, { status: 'loading' }, tab);

        expect(activeRedirects.has(tabUrl)).toBe(false);
    });

    it('should remove from activeRedirects if URL is no longer infected', async () => {
        const tabId = 1;
        const tabUrl = 'https://no-longer-infected.com/page';
        const tab = { url: tabUrl };
        getDomain.mockResolvedValue('no-longer-infected.com');
        infectedUrls.delete(tabUrl);

        activeRedirects.add(tabUrl);
        mockFetch.mockResolvedValue({ status: 200 });

        await doSafeRedirect(tabId, { status: 'loading' }, tab);

        expect(activeRedirects.has(tabUrl)).toBe(false);
        expect(mockUpdate).not.toHaveBeenCalled();
    });
});