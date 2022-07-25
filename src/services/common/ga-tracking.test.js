jest.mock('../../config/config', () => ({
    config: { googleAnalyticsId: 'mock' }
}));

describe('ga-tracking', () => {
    it('should add google analitycs script to html', () => {
        const createElementMock = jest.fn();
        const getElementsByTagNameMock = jest.fn();
        const insertBeforeMock = jest.fn();

        document.createElement = createElementMock;
        document.getElementsByTagName = getElementsByTagNameMock;

        createElementMock.mockReturnValueOnce(() => ({}));
        getElementsByTagNameMock.mockReturnValueOnce([{ parentNode: { insertBefore: insertBeforeMock } }]);

        require('./ga-tracking');

        expect(createElementMock).toHaveBeenCalledWith('script');
        expect(getElementsByTagNameMock).toHaveBeenCalledWith('script');
        expect(insertBeforeMock).toHaveBeenCalled();
    });
});