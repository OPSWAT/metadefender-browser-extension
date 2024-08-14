import browserExtension from './browser-extension';

describe('isAllowedFileSchemeAccess', () => {
    beforeEach(() => {
        // Mock the chrome.extension.isAllowedFileSchemeAccess method
        global.chrome = {
            extension: {
                isAllowedFileSchemeAccess: jest.fn(),
            },
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should resolve with true when access is allowed', async () => {
        // Arrange: mock the Chrome API to call the callback with true
        global.chrome.extension.isAllowedFileSchemeAccess.mockImplementation((callback) => callback(true));

        // Act: call the function
        const result = await browserExtension.isAllowedFileSchemeAccess();

        // Assert: check if the result is true
        expect(result).toBe(true);
        expect(global.chrome.extension.isAllowedFileSchemeAccess).toHaveBeenCalled();
        expect(global.chrome.extension.isAllowedFileSchemeAccess.mock.calls[0][0]).toBeInstanceOf(Function);
    });

    it('should resolve with false when access is not allowed', async () => {
        // Arrange: mock the Chrome API to call the callback with false
        global.chrome.extension.isAllowedFileSchemeAccess.mockImplementation((callback) => callback(false));

        // Act: call the function
        const result = await browserExtension.isAllowedFileSchemeAccess();

        // Assert: check if the result is false
        expect(result).toBe(false);
        expect(global.chrome.extension.isAllowedFileSchemeAccess).toHaveBeenCalled();
        expect(global.chrome.extension.isAllowedFileSchemeAccess.mock.calls[0][0]).toBeInstanceOf(Function);
    });

});
