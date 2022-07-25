(function () {
    // Google Analytics Setup
    if (typeof window !== 'undefined') {
        window._gaq = window._gaq || [];
        const MCL = require('../../config/config');

        if (!(MCL?.config?.googleAnalyticsId)) {
            window._gaq = { push: () => { } };
            return;
        }

        _gaq.push(['_setAccount', MCL.config.googleAnalyticsId]);

        const ga = document.createElement('script');
        ga.type = 'text/javascript';
        ga.async = true;
        ga.src = 'https://ssl.google-analytics.com/ga.js';
        const s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(ga, s);
    }
})();