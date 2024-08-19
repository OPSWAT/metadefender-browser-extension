import React, { createContext, useEffect, useState, useContext } from 'react';
import PropTypes from 'prop-types';

import { settings } from '../services/common/persistent/settings';

import BrowserExtension from '../services/common/browser/browser-extension';
import BrowserNotification from '../services/common/browser/browser-notification';
import BrowserTranslate from '../services/common/browser/browser-translate';

import CoreClient from '../services/common/core-client';

import { GaTrack } from '../services/ga-track';
import ConfigContext from './ConfigProvider';
import browserStorage from '../services/common/browser/browser-storage';
import BackgroundTask from '../services/background/background-task';
import cookieManager from '../services/background/cookie-manager';

const SettingsContext = createContext();
export default SettingsContext;

export const validateCoreSettings = async (newApikey, newUrl) => {
    const apikey = newApikey || settings.coreApikey;
    const endpoint = newUrl || settings.coreUrl;

    if (!apikey || !endpoint) {
        return;
    }

    CoreClient.configure({ apikey, endpoint });
    try {
        const versionResult = await CoreClient.version();
        const coreV4 = (versionResult?.version.split('.')[0] === '4') || settings.coreV4;
        const rulesResult = await CoreClient.rules('');
        const rules = rulesResult.map(rule => rule.name);
        return {
            coreV4,
            rules
        };
    } catch (error) {
        console.warn(error);
    }

    return false;
};

export const validateCustomApikey = async (newCustomApikey) => {
    try {
        const apikeyCustom = newCustomApikey || settings.apikeyCustom;

        if (apikeyCustom && apikeyCustom.length !== 32) {
            settings.apikeyCustom = ''
            return false;
        }

        return true;
    } catch (error) {
        console.warn(error.message);
        return false;
    }
};


export const SettingsProvider = ({ children }) => {

    const config = useContext(ConfigContext);
    const [settingsData, setSettingsData] = useState(settings.data);
    const [isAllowedFileSchemeAccess, setIsAllowedFileSchemeAccess] = useState(true); // ToDo: move to BrowserProvider

    const getScanRules = async (newApikey, newUrl) => {

        const validCore = await validateCoreSettings(newApikey, newUrl);
        if (validCore) {
            const { coreV4, rules } = validCore;
            settings.merge({ coreV4, rules });
            await settings.save();
            setSettingsData({ ...settings.data });
        }
    }


    /**
     * Update settings
     * @param {string} key 
     * @param {object} newSettingsData
     */
    const updateSettings = async (key, newSettingsData) => {
        const newSettings = { ...settings.data };
        const backgroundTask = new BackgroundTask();
        const cookie = await cookieManager.get();
        const authCookie = JSON.parse(cookie.value);
        console.log('newSettings', newSettings)
        switch (key) {
            case 'coreSettings': {
                newSettings.coreApikey = newSettingsData.coreApikey;
                newSettings.coreUrl = newSettingsData.coreUrl;

                if (!newSettingsData.coreApikey || !newSettingsData.coreUrl) {
                    newSettings.useCore = false;
                    break;
                }

                const validCore = await validateCoreSettings(newSettingsData.coreApikey, newSettingsData.coreUrl);

                if (validCore) {
                    newSettings.coreV4 = validCore.coreV4;
                    newSettings.rules = validCore.rules;
                    newSettings.coreRule = newSettingsData.coreRule;
                    await BrowserNotification.create(BrowserTranslate.getMessage('coreSettingsSavedNotification'), 'info');
                    newSettings.useCore = true;
                } else {
                    newSettings.useCore = false;
                    await BrowserNotification.create(BrowserTranslate.getMessage('coreSettingsInvalidNotification'), 'info');
                }
                break;
            }
            case 'customSettings': {
                newSettings.apikeyCustom = newSettingsData?.apikeyCustom;
                if (!newSettingsData.apikeyCustom) {
                    newSettings.apikeyCustom = '';
                    newSettings.useCustomApiKey = false;
                    break;
                }
                const validApikey = await validateCustomApikey(newSettingsData?.apikeyCustom);
                if (validApikey) {
                    newSettings.apikeyCustom = newSettingsData?.apikeyCustom;
                    await BrowserNotification.create(BrowserTranslate.getMessage('apikeyNotification'), 'info');
                    newSettings.useCustomApiKey = true;
                } else {
                    newSettings.apikeyCustom = '';
                    newSettings.useCustomApiKey = false;
                    await backgroundTask.updateApikeyInfo(authCookie.apikey, authCookie.loggedIn);
                }
                break;
            }
            case 'whiteListCustomSettings': {
                if (!newSettingsData?.whiteListCustom) {
                    newSettings.whiteListCustom = [];
                    newSettings.useWhiteList = false;
                    break;
                }
                if (newSettingsData?.whiteListCustom.length > 0) {
                    newSettings.whiteListCustom = newSettingsData?.whiteListCustom;
                    newSettings.useWhiteList = true;
                    await BrowserNotification.create(BrowserTranslate.getMessage('whiteListSavedNotification'), 'info');
                } else {
                    newSettings.useWhiteList = false;
                    newSettings.whiteListCustom = []
                }
                break;
            }
            case 'useCore': {
                const useCore = !newSettings.useCore;

                if (useCore) {
                    const validCore = await validateCoreSettings();
                    if (validCore) {
                        newSettings.coreV4 = validCore.coreV4;
                        newSettings.rules = validCore.rules;
                        newSettings.useCore = true;
                    }
                } else {
                    newSettings.useCore = false;
                }
                break;
            }
            case 'useCustomApiKey': {
                const useCustomApiKey = !newSettings.useCustomApiKey;
                if (useCustomApiKey) {
                    const validApikey = await validateCustomApikey();
                    if (validApikey) {
                        newSettings.apikeyCustom = validApikey.apikeyCustom;
                        newSettings.useCustomApiKey = true;
                    }
                } else {
                    newSettings.apikeyCustom = ''
                    newSettings.useCustomApiKey = false;
                    await backgroundTask.updateApikeyInfo(authCookie.apikey, authCookie.loggedIn);
                }
                break;
            }

            case 'useWhitelist': {
                const useWhiteList = !newSettings.useWhiteList;
                if (useWhiteList) {
                    if (newSettingsData?.whiteListCustom.length > 0) {
                        newSettings.whiteListCustom = settings?.whiteListCustom;
                        newSettings.useWhiteList = true;
                    }
                } else {
                    newSettings.useWhiteList = false;
                    newSettings.whiteListCustom = []
                }
                break;
            }

            case 'scanDownloads': {
                newSettings.scanDownloads = !newSettings.scanDownloads && isAllowedFileSchemeAccess;
                break;
            }
            default:
                newSettings[key] = !newSettings[key];
                break;
        }

        settings.merge(newSettings);
        await settings.save();
        setSettingsData({ ...settings.data });

        GaTrack(['_trackEvent', config.gaEventCategory.name, config.gaEventCategory.action.settingsChanged, key, (newSettings[key] ? 'enabled' : 'disabled')]);
    };


    function storageUpdateHandler(changes) {
        const storageKey = config.storageKey?.settings;
        if (Object.keys(changes).includes(storageKey)) {
            settings.merge(changes[storageKey].newValue);
        }
    }


    useEffect(() => {
        (async () => {
            await settings.init();
            setIsAllowedFileSchemeAccess(await BrowserExtension.isAllowedFileSchemeAccess());
            setSettingsData({ ...settings.data });
        })();

        browserStorage.addListener(storageUpdateHandler);

        return () => {
            browserStorage.removeListener(storageUpdateHandler);
        }
    }, []);

    return (
        <SettingsContext.Provider value={{
            settings,
            settingsData,
            updateSettings,
            isAllowedFileSchemeAccess,
            getScanRules,
        }}>
            {children}
        </SettingsContext.Provider>
    )

}

SettingsProvider.propTypes = {
    children: PropTypes.element.isRequired
};
