import { callAPI } from './callAPI';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('callAPI', () => {
    beforeEach(() => {
        mockFetch.mockImplementation(() => Promise.resolve({ json: () => Promise.resolve() }));
    });

    it('should correct call fetch', (done) => {
        const mockUrl = '/mock';
        const mockOptions = { mock: 'mock' };

        callAPI(mockUrl, mockOptions);

        setTimeout(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                mockUrl,
                { ...mockOptions, method: 'GET' },
            );

            done();
        }, 0);
    });
});