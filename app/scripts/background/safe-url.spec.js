import chrome from 'sinon-chrome';
import SafeUrl from './safe-url';

describe('app/scripts/background/safe-url.js', () => {

    beforeAll(() => {
        global.chrome = chrome;
    });

    describe('enabled', () => {

        it('should be disabled by default', () => {
            expect(SafeUrl.enabled).toBeFalsy();
        });
    });

    describe('toggle', () => {

        it('should enable safe url', () => {
            chrome.webRequest.onBeforeRequest.addListener.resetHistory();

            SafeUrl.enabled = false;
            const enabled = SafeUrl.toggle(true);
            const callArgs = chrome.webRequest.onBeforeRequest.addListener.getCall(0).args;

            expect(enabled).toBeTruthy();
            expect(callArgs.length).toEqual(3);
            expect(typeof callArgs[0]).toBe('function');
            expect(callArgs[1]).toEqual({urls: ['<all_urls>']});
            expect(callArgs[2]).toEqual(['blocking']);
        });

        it('shold not change enabled state', () => {
            SafeUrl.enabled = false;
            expect(typeof SafeUrl.toggle(false)).toBe('undefined');
        });

        it('should disable safe url', () => {
            chrome.webRequest.onBeforeRequest.removeListener.resetHistory();

            SafeUrl.enabled = true;
            const enabled = SafeUrl.toggle(false);
            const callArgs = chrome.webRequest.onBeforeRequest.removeListener.getCall(0).args;

            expect(enabled).toBeFalsy();
            expect(callArgs.length).toEqual(1);
            expect(typeof callArgs[0]).toBe('function');
        });
    
    });

    describe('_safeRedirect', () => {

        it('should ignore page resource requests and invalid urls', () => {
        
            expect(typeof SafeUrl._safeRedirect({tabId: 0, type: 'main_frame', url: 'https://'})).toBe('undefined');
            expect(typeof SafeUrl._safeRedirect({tabId: 1, type: 'image', url: 'https://'})).toBe('undefined');
            expect(typeof SafeUrl._safeRedirect({tabId: 1, type: 'main_frame', url: ''})).toBe('undefined');
            expect(typeof SafeUrl._safeRedirect({tabId: 1, type: 'main_frame', url: 'file://'})).toBe('undefined');
        
        });

        it('should not redirect metadefender safe redirect endpoint', () => {

            expect(typeof SafeUrl._safeRedirect({tabId: 1, type: 'main_frame', url: `${MCL.config.mclDomain}/safe-redirect/`})).toBe('undefined');

        });

        it('should redirect on first access and not after redirect', () => { 

            const testUrl = 'http://metadefender.opswat.com';
            const details = {
                tabId: 1, 
                type: 'main_frame', 
                url: testUrl
            };

            const redirect = SafeUrl._safeRedirect(details);

            expect(typeof redirect.redirectUrl).toBe('string');
            expect(redirect.redirectUrl.startsWith(`${MCL.config.mclDomain}/safe-redirect/`)).toBeTruthy();
            expect(redirect.redirectUrl.endsWith(encodeURIComponent(testUrl))).toBeTruthy();

            expect(typeof SafeUrl._safeRedirect(details)).toBe('undefined');

        });

    });

});