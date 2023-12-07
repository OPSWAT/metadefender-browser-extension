import './common/ga-tracking';

export const GaTrack = (event) => {
    window._gaq = window._gaq || [];
    window._gaq.push(event);
};