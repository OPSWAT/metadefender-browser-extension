import './common/ga-tracking';

export const GaTrack = (event) => {
    _gaq.push(event);
};