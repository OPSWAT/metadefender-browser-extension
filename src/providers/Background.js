import PropTypes from 'prop-types';
import React, { createContext, useContext, useEffect, useState } from 'react';
import config from '../config/common.json';
import MCL from '../config/config';
import { Task } from '../services/background/background-task';
import browserStorage from '../services/common/browser/browser-storage';
import { GaTrack } from '../services/ga-track';

export const BackgroundContext = createContext();

export const useBackgroundContext = () => useContext(BackgroundContext);

export const BackgroundProvider = ({ children }) => {
    const backgroundTask = Task;

    const [scanHistory, setScanHistory] = useState(backgroundTask.getScanHistory() || null);
    const [apikeyInfo, setApikeyInfo] = useState(backgroundTask.getApikeyInfo() || null);
    const [settings, setSettings] = useState(backgroundTask.getSettings() || null);

    const [apikeyData, setApikeyData] = useState();

    const messageListener = (changes) => {
        if (Object.keys(changes).includes('apikey')) {
            setApikeyData(changes.apikey.newValue);
        }
    };

    const gaTrackEvent = (event) => {
        GaTrack(event);
    };

    useEffect(() => {
        backgroundTask.init();

        browserStorage.addListener(messageListener);

        const scanHistoryObj = backgroundTask.getScanHistory();
        const apikeyInfoObj = backgroundTask.getApikeyInfo();
        const settingsObj = backgroundTask.getSettings();

        setScanHistory(scanHistoryObj);
        setApikeyInfo(apikeyInfoObj);
        setSettings(settingsObj);

        (async () => {
            try {
                await settingsObj.load();
                await scanHistoryObj.load();
                const { apikey } = await apikeyInfoObj.load();

                setApikeyData(apikey);
            } catch (err) {
                console.log(err);
            }
        })();
    }, []);

    return (
        <BackgroundContext.Provider
            value={{
                scanHistory,
                apikeyInfo,
                settings,

                apikeyData,

                // Google Analytics
                gaTrackEvent,

                // Config variables
                MCL,
                config,
            }}
        >
            {children}
        </BackgroundContext.Provider>
    );
};

BackgroundProvider.propTypes = {
    children: PropTypes.element.isRequired
};

export default BackgroundContext;