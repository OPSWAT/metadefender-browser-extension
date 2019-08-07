import chrome from 'sinon-chrome';
import sinon from 'sinon';
import xhr from 'xhr';
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
            expect(callArgs[1]).toEqual({urls: ['http://*/*', 'https://*/*'], types: ['main_frame']});
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

    describe('_handleUrlValidatorResponse', () => {

        it('should mark url as infected', () => {
            SafeUrl._handleUrlValidatorResponse('a1', 'error', {});
            expect(SafeUrl._cleanUrls.has('a1')).toBeTruthy();
            
            SafeUrl._handleUrlValidatorResponse('a2', '', {headers: {status: '200'}});
            expect(SafeUrl._cleanUrls.has('a2')).toBeTruthy();

            SafeUrl._handleUrlValidatorResponse('a3', '', {headers: {status: '404'}});
            expect(SafeUrl._cleanUrls.has('a3')).toBeTruthy();
        });

        it('should mark the url as infected', () => {
            SafeUrl._handleUrlValidatorResponse('b1', '', {headers: {status: '400'}});
            expect(SafeUrl._infectedUrls.has('b1')).toBeTruthy();
        });
    
    });

    describe('_doSafeRedirect', () => {

        it('should not redirect metadefender safe redirect endpoint', () => {
            expect(typeof SafeUrl._doSafeRedirect({type: 'main_frame', url: `${MCL.config.mclDomain}/safe-redirect/`})).toBe('undefined');
        });

        it('should not redirect clean URLs', () => {
            const testUrl = 'http://metadefender.opswat.com';
            const details = {
                url: testUrl
            };
            sinon.stub(xhr, 'get').callsFake(() => SafeUrl._handleUrlValidatorResponse(testUrl, 'error', {}));

            const redirect = SafeUrl._doSafeRedirect(details);
            expect(typeof redirect).toBe('undefined');

            xhr.get.restore();
        });

        it('should redirect infected URLs', () => {
            const testUrl = 'http://infected.url';
            const details = {
                url: testUrl
            };
            sinon.stub(xhr, 'get').callsFake(() => SafeUrl._handleUrlValidatorResponse(testUrl, '', {headers: {status: '400'}}));

            const redirect = SafeUrl._doSafeRedirect(details);
            expect(typeof redirect.redirectUrl).toBe('string');
            expect(redirect.redirectUrl.startsWith(`${MCL.config.mclDomain}/safe-redirect/`)).toBeTruthy();
            expect(redirect.redirectUrl.endsWith(encodeURIComponent(testUrl))).toBeTruthy();

            xhr.get.restore();
        });

        it('should not redirect infected URLs on second access', () => {
            const testUrl = 'http://infected.url/access';
            const details = {
                url: testUrl
            };
            sinon.stub(xhr, 'get').callsFake(() => SafeUrl._handleUrlValidatorResponse(testUrl, '', {headers: {status: '400'}}));

            SafeUrl._doSafeRedirect(details);
            expect(typeof SafeUrl._doSafeRedirect(details)).toBe('undefined');
            
            xhr.get.restore();
        });
    });

});