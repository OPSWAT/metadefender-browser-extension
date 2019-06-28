import chrome from 'sinon-chrome';
import browserExtension from './browser-extension';

describe('app/scripts/common/browser/browser-extension.js', () => {

    beforeAll(() => {
        global.chrome = chrome;
    });

    describe('isAllowedFileSchemeAccess', () => {

        beforeAll(() => {
            chrome.extension.isAllowedFileSchemeAccess.flush();
            chrome.extension.isAllowedFileSchemeAccess.callsArgWith(0, true);
        });

        it('should call chrome.extension.isAllowedFileSchemeAccess and return a promise', async () => {

            const isAllowedPromise = browserExtension.isAllowedFileSchemeAccess();
            expect(isAllowedPromise instanceof Promise).toBeTruthy();
            expect(await isAllowedPromise).toBe(true);

        });
    
    });
    

});


