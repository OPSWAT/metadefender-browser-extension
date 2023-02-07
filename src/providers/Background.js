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

const onUpdate = (tabId, info, tab) => /^https?:/.test(info.url) && findTab([tab]);
findTab();
chrome.runtime.onConnect.addListener(port => {
    if (port.name === 'keepAlive') {
        setTimeout(() => port.disconnect(), 250e3);
        port.onDisconnect.addListener(() => findTab());
    }
});
async function findTab(tabs) {
    if (chrome.runtime.lastError) { /* tab was closed before setTimeout ran */ }
    for (const {id: tabId} of tabs || await chrome.tabs.query({url: '*://*/*'})) {
        try {
            await chrome.scripting.executeScript({target: {tabId}, func: connect});
            chrome.tabs.onUpdated.removeListener(onUpdate);
            return;
        } catch (e) {}
    }
    chrome.tabs.onUpdated.addListener(onUpdate);
}
function connect() {
    chrome.runtime.connect({name: 'keepAlive'})
        .onDisconnect.addListener(connect);
}