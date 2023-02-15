import './common/ga-tracking';

export const GaTrack = (event) => {
    let _gaq = _gaq || [];
    _gaq.push(event);
};