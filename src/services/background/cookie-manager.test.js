import MCL from '../../config/config';
import cookieManager from './cookie-manager';

// Mock functions for chrome.cookies
const mockAddListener = jest.fn();
const mockGet = jest.fn();

// Mock the global chrome object
global.chrome = {
    cookies: {
        onChanged: {
            addListener: mockAddListener,
        },
        get: mockGet,
    },
    experimental: {
        cookies: {
            onChanged: {
                addListener: mockAddListener,
            },
            get: mockGet,
        },
    },
};

describe('CookieManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock MCL.config values
        MCL.config = {
            mclDomain: 'https://example.com',
            authCookieName: 'auth_token',
        };
    });

    it('should register a callback on cookies change', () => {
        const callback = jest.fn();
        const manager = cookieManager; // Use the already instantiated object
        manager.onChange(callback);
        expect(mockAddListener).toHaveBeenCalledWith(callback);
    });

    it('should get the cookie with the correct parameters', async () => {
        mockGet.mockResolvedValue({ value: 'mocked_cookie_value' });

        const manager = cookieManager; // Use the already instantiated object
        const cookie = await manager.get();

        expect(mockGet).toHaveBeenCalledWith({
            url: MCL.config.mclDomain,
            name: MCL.config.authCookieName
        });
        expect(cookie).toEqual({ value: 'mocked_cookie_value' });
    });
});
