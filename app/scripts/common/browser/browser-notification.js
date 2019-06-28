'use strict';

import { settings } from './../persistent/settings';

/**
 * browser.notifications extension
 *
 * @type {{create: create}}
 */
const browserNotification = {
    create: create
};

export default browserNotification;

var activeNotifications = {};

/**
 *
 * @param message
 * @param id
 * @param fileInfected
 */
async function create(message, id, fileInfected) {

    let icon = '/images/ext-notification.png';
    if (typeof fileInfected !== 'undefined') {
        icon = (fileInfected) ? '/images/ext-notification-infected.png' : '/images/ext-notification-clean.png';
    }

    await settings.load();
    if (!settings.showNotifications) {
        return;
    }

    try {
        var optionObject = {
            type: 'basic',
            iconUrl: icon,
            title: chrome.i18n.getMessage('appName'),
            message: message,
            priority: 1,
            isClickable: true
        };

        if (typeof id === 'undefined') {
            chrome.notifications.create(optionObject, clearNotification);
        }
        else {
            chrome.notifications.create(String(id), optionObject, clearNotification);
        }

    } catch (e) {
        console.error(e);
    }
}

function clearNotification(notificationId) {
    if (typeof (activeNotifications[notificationId]) !== 'undefined') {
        clearTimeout(activeNotifications[notificationId]);
    }

    activeNotifications[notificationId]  = setTimeout(() => {
        chrome.notifications.clear(notificationId);
        delete activeNotifications[notificationId];
    }, MCL.config.browserNotificationTimeout);
}
