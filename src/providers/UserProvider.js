import PropTypes from 'prop-types';
import React, { createContext, useEffect, useState } from 'react';

import browserStorage from '../services/common/browser/browser-storage';

import { apikeyInfo } from '../services/common/persistent/apikey-info';

export const UserContext = createContext();
export default UserContext;

export const UserProvider = ({ children }) => {
    const [apikeyData, setApikeyData] = useState(null);
    const apikeyUpdateHandler = (changes) => {
        if (Object.keys(changes).includes('apikey')) {
            setApikeyData(changes.apikey.newValue);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                await apikeyInfo.init();
                setApikeyData(apikeyInfo.data);
            } catch (err) {
                console.warn(err);
            }
        })();

        browserStorage.addListener(apikeyUpdateHandler);

        return () => {
            browserStorage.removeListener(apikeyUpdateHandler);
        };
    }, []);

    return (
        <UserContext.Provider
            value={{
                apikeyData,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

UserProvider.propTypes = {
    children: PropTypes.element.isRequired,
};

// ToDo: What does the code below do?
const onUpdate = (tabId, info, tab) => /^https?:/.test(info.url) && findTab([tab]);
findTab();
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'keepAlive') {
        setTimeout(() => port.disconnect(), 250e3);
        port.onDisconnect.addListener(() => findTab());
    }
});

async function findTab(tabs) {
    if (chrome.runtime.lastError) {
        /* tab was closed before setTimeout ran */
    }
    const regularTabs = await chrome.tabs.query({ url: '*://*/*' });
    if (!(tabs || regularTabs)) {
        return;
    }

    for (const { id: tabId } of tabs || regularTabs) {
        try {
            await chrome.scripting.executeScript({ target: { tabId }, func: connect });
            chrome.tabs.onUpdated.removeListener(onUpdate);
            return;
        } catch (e) { }
    }
    chrome.tabs.onUpdated.addListener(onUpdate);
}
function connect() {
    chrome.runtime.connect({ name: 'keepAlive' }).onDisconnect.addListener(connect);
}
