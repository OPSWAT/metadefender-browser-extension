(function() {
    // Google Analytics Setup
    window._gaq = window._gaq || [];

    if (!(MCL && MCL.config && MCL.config.googleAnalyticsId)) {
        window._gaq = {push: () => {}};
        return;
    }

    _gaq.push(['_setAccount', MCL.config.googleAnalyticsId]);

    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
})();