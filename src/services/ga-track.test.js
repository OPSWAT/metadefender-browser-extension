import { GaTrack } from './ga-track';

global._gaq = [];

describe('ga-track', () => {
    it('should push to array', () => {
        GaTrack('mock');

        expect(global._gaq).toHaveLength(1);
    });
});