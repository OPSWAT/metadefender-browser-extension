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

const SettingsContext = createContext();
export default SettingsContext;

export const validateCoreSettings = async (newApikey, newUrl) => {
    const apikey = newApikey || settings.coreApikey;
    const endpoint = newUrl || settings.coreUrl;
    
    if (!apikey || !endpoint) {
        return;
    }

    CoreClient.configure({apikey, endpoint});

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

export const SettingsProvider = ({ children }) => {

    const config = useContext(ConfigContext);
    const [settingsData, setSettingsData] = useState(settings.data);
    const [isAllowedFileSchemeAccess, setIsAllowedFileSchemeAccess] = useState(true); // ToDo: move to BrowserProvider

    const getScanRules = async (newApikey, newUrl) => {

        const validCore = await validateCoreSettings(newApikey, newUrl);

        if (validCore) {
            const { coreV4, rules } = validCore;
            settings.merge({coreV4, rules});
            await settings.save();
            setSettingsData({...settings.data});
        }
    }


    /**
     * Update settings
     * @param {string} key 
     * @param {object} coreSettingsParam 
     */
    const updateSettings = async (key, coreSettingsParam) => {
        const newSettings = {...settings.data};
        switch (key) {
            case 'coreSettings': {
                newSettings.coreApikey = coreSettingsParam.coreApikey;
                newSettings.coreUrl = coreSettingsParam.coreUrl;

                if (!coreSettingsParam.coreApikey || !coreSettingsParam.coreUrl) {
                    newSettings.useCore = false;
                    break;
                }

                const validCore = await validateCoreSettings(coreSettingsParam.coreApikey, coreSettingsParam.coreUrl);

                if (validCore) {
                    newSettings.coreV4 = validCore.coreV4;
                    newSettings.rules = validCore.rules;
                    newSettings.coreRule = coreSettingsParam.coreRule;
                    await BrowserNotification.create(BrowserTranslate.getMessage('coreSettingsSavedNotification'), 'info');
                    newSettings.useCore = true;
                } else {
                    newSettings.useCore = false;
                    await BrowserNotification.create(BrowserTranslate.getMessage('coreSettingsInvalidNotification'), 'info');
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
            case 'scanDownloads': {
                newSettings.scanDownloads = !newSettings.scanDownloads && isAllowedFileSchemeAccess;
                break;
            }
            case 'scanUploads': {
                newSettings.scanUploads = !newSettings.scanUploads && isAllowedFileSchemeAccess;
                break;
            }
            default:
                newSettings[key] = !newSettings[key];
                break;
        }
        
        settings.merge(newSettings);
        await settings.save();
        setSettingsData({...settings.data});

        GaTrack(['_trackEvent', config.gaEventCategory.name, config.gaEventCategory.action.settingsChanged, key, (newSettings[key] ? 'enabled' : 'disabled')]);
    };


    function storageUpdateHandler(changes) {
        const storageKey = config.storageKey.settings;
        if (Object.keys(changes).includes(storageKey)) {
            settings.merge(changes[storageKey].newValue);
        }
    }


    useEffect(() => {
        (async () => {
            await settings.init();
            setIsAllowedFileSchemeAccess(await BrowserExtension.isAllowedFileSchemeAccess());
            setSettingsData({...settings.data});
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
