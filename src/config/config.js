export default {
    config: {
        'env': '/* @echo env */',

        'opswatDomain': '/* @echo opswatDomain */',
        'mclDomain': '/* @echo mclDomain */',
        'mclApikeyPage': '/* @echo mclApikeyPage */',

        'metadefenderDomain': '/* @echo metadefenderDomain */',
        'metadefenderVersion': '/* @echo metadefenderVersion */',

        'googleAnalyticsId': '/* @echo googleAnalyticsId */',
        'gaEventCategory': {
            'name': '/* @echo gaEventCategory.name */',
            'action': {
                'linkClicked': '/* @echo gaEventCategory.action.linkClicked */',
                'buttonClickd': '/* @echo gaEventCategory.action.buttonClickd */',
                'settingsChanged': '/* @echo gaEventCategory.action.settingsChanged */'
            },
            'label': {
                'scanHistory': '/* @echo gaEventCategory.label.scanHistory */',
                'metadefender': '/* @echo gaEventCategory.label.metadefender */',
                'scanDetails': '/* @echo gaEventCategory.label.scanDetails */',
                'loginButton': '/* @echo gaEventCategory.label.loginButton */',
                'clearHistoryButton': '/* @echo gaEventCategory.label.clearHistoryButton */'
            },
            'value': {
                'loginButton': '/* @echo gaEventCategory.value.loginButton */',
                'deleteItemButton': '/* @echo gaEventCategory.value.deleteItemButton */',
                'clearHistoryButton': '/* @echo gaEventCategory.value.clearHistoryButton */'
            }
        },

        'storageKey': {
            'settings': '/* @echo storageKey.settings */',
            'scanHistory': '/* @echo storageKey.scanHistory */',
            'apikey': '/* @echo storageKey.apikey */'
        },

        'contextMenu': {
            'scanId': '/* @echo contextMenu.scanId */'
        },

        'fileSizeLimit': '/* @echo fileSizeLimit */',

        'scanResults': {
            'incrementor': '/* @echo scanResults.incrementor */',
            'maxInterval': '/* @echo scanResults.maxInterval */'
        },

        'authCookieName': '/* @echo authCookieName */',

        'sanitizationBuckets': [
            'd.files.metadefender.com',
            't.files.metadefender.com',
            'p.files.metadefender.com',
            'g.files.metadefender.com'
        ],

        'browserNotificationTimeout': 5000,

        'maxCleanUrls': 1000
    }
};