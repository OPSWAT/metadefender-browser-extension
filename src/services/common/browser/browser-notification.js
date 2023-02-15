'use strict';

import { settings } from './../persistent/settings';
import MCL from '../../../config/config';
import '../ga-tracking';

/**
 * browser.notifications extension
 *
 * @type {{create: create}}
 */
const browserNotification = {
    create: create
};

export default browserNotification;

const activeNotifications = {};

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

    const settingsData = await settings.load();
    if (!settingsData.showNotifications) {
        return;
    }

    try {
        const optionObject = {
            type: 'basic',
            iconUrl: icon,
            title: chrome.i18n.getMessage('appName'),
            message: message,
            priority: 1,
            isClickable: (typeof fileInfected !== 'undefined')
        };
        if (typeof id === 'undefined') {
            chrome.notifications.create(optionObject, clearNotification);
        }
        else {
            chrome.notifications.create(String(id), optionObject, clearNotification);
        }

    } catch (error) {
        console.warn(error);
        global._gaq.push(['exception', { exDescription: 'browser-notification:create' + JSON.stringify(error) }]);
    }
}

function clearNotification(notificationId) {
    if (typeof (activeNotifications[notificationId]) !== 'undefined') {
        clearTimeout(activeNotifications[notificationId]);
    }

    activeNotifications[notificationId] = setTimeout(() => {
        chrome.notifications.clear(notificationId);
        delete activeNotifications[notificationId];
    }, MCL.config.browserNotificationTimeout);
}
