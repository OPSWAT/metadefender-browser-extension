import chrome from 'sinon-chrome';
import browserMessage from './browser-message';

describe('app/scripts/common/browser/browser-message.js', () => {

    beforeAll(() => {
        global.chrome = chrome;
    });

    describe('send', () => {

        beforeAll(() => {
            chrome.runtime.sendMessage.flush();
            chrome.runtime.sendMessage.callsArgWith(2, true);
        });

        it('should call chrome.runtime.sendMessage and return a promise', async () => {

            const sendPromise = browserMessage.send('message', 'options');
            expect(sendPromise instanceof Promise).toBeTruthy();
            expect(await sendPromise).toBe(true);
            expect(chrome.runtime.sendMessage.calledWith('message', 'options')).toBeTruthy();
            
        });
    
    });

    describe('addListener', () => {

        it('should add a browser message listener', async () => {
        
            spyOn(chrome.runtime.onMessage, 'addListener');
            browserMessage.addListener(() => {});

            expect(chrome.runtime.onMessage.addListener.calls.count()).toBe(1);
        
        });
    
    });

});

