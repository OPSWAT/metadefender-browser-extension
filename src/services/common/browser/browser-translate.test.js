import browserTranslate from './browser-translate';

describe('browser-translate', () => {
    const getMessageResponse = 'Message with id';
    const getMessageSpy = jest.spyOn(chrome.i18n, 'getMessage');

    it('should get correct message', () => {
        getMessageSpy.mockImplementationOnce(() => getMessageResponse);

        expect(browserTranslate.getMessage()).toEqual(getMessageResponse);
    });

    it('should get correct message replaced', () => {
        getMessageSpy.mockImplementationOnce(() => getMessageResponse);

        expect(browserTranslate.getMessage('', { id: 'mock' })).toEqual('Message with mock');
    });
});
