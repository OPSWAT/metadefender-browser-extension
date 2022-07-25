import safeUrl from './safe-url';

const mockFetch = jest.fn();
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


describe('safe-url', () => {
    beforeEach(() => {
        mockFetch.mockImplementation(() => Promise.resolve({ json: () => Promise.resolve() }));
    });

    it('should have correct defaults', () => {
        expect(safeUrl.enabled).toBe(false);
    });

    it('should not toggle because of same value', async () => {
        const response = await safeUrl.toggle(false);

        expect(response).toBe(undefined);
        expect(safeUrl.enabled).toBe(false);
    });

    it('should enbale safeUrl and update tab', async () => {
        mockFetch.mockImplementation(() => Promise.resolve({ headers: { status: '400' } }));
        mockAddListener.mockImplementation((cb) => cb(0, { status: 'complete' }, { url: 'mock' }));

        const response = await safeUrl.toggle(true);

        expect(response).toBe(true);
        expect(mockAddListener).toHaveBeenCalled();
        expect();
    });

    it('should disable safeUrl', async () => {
        const response = await safeUrl.toggle(false);

        expect(response).toBe(false);
        expect(mockRemoveListener).toHaveBeenCalled();
    });
});