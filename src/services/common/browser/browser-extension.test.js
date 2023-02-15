import browserExtension from './browser-extension';

describe('browser-extension', () => {
    const isAllowedFileSchemeAccessSpy = jest.spyOn(chrome.extension, 'isAllowedFileSchemeAccess');

    it('should run as expected', (done) => {
        browserExtension.isAllowedFileSchemeAccess();

        setTimeout(() => {
            expect(isAllowedFileSchemeAccessSpy).toHaveBeenCalled();

            done();
        }, 0);
    });
});