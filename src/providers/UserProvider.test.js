import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { UserProvider, UserContext } from './UserProvider';
import { apikeyInfo } from '../services/common/persistent/apikey-info';
import browserStorage from '../services/common/browser/browser-storage';

// Mock implementations
jest.mock('../services/common/persistent/apikey-info', () => ({
    apikeyInfo: {
        init: jest.fn(),
        data: null
    }
}));

jest.mock('../services/common/browser/browser-storage', () => ({
    addListener: jest.fn(),
    removeListener: jest.fn()
}));


global.chrome = {
    runtime: {
        lastError: null
    },
    tabs: {
        query: jest.fn(),
        onUpdated: {
            addListener: jest.fn(),
            removeListener: jest.fn()
        }
    },
    scripting: {
        executeScript: jest.fn()
    }
};


const connect = jest.fn();
const onUpdate = jest.fn();

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

describe('UserProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize apikeyData from apikeyInfo on mount', async () => {
        const mockData = { key: 'value' };
        apikeyInfo.data = mockData;
        apikeyInfo.init.mockResolvedValueOnce();

        // Render the provider
        render(
            <UserProvider>
                <UserContext.Consumer>
                    {value => <div>{value.apikeyData ? 'Data Exists' : 'No Data'}</div>}
                </UserContext.Consumer>
            </UserProvider>
        );

        await act(async () => {
            await apikeyInfo.init();
        });

        expect(screen.getByText('Data Exists')).toBeInTheDocument();
    });

    it('should update apikeyData when apikeyUpdateHandler is called', () => {
        const newApikeyData = { key: 'newValue' };
        let updateHandler = jest.fn();

        browserStorage.addListener.mockImplementation((handler) => {
            updateHandler = handler;
        });

        render(
            <UserProvider>
                <UserContext.Consumer>
                    {value => <div>{value.apikeyData ? 'Data Exists' : 'No Data'}</div>}
                </UserContext.Consumer>
            </UserProvider>
        );

        act(() => {
            updateHandler({ apikey: { newValue: newApikeyData } });
        });

        expect(screen.getByText('Data Exists')).toBeInTheDocument();
    });

    it('should add and remove browserStorage listeners on mount and unmount', () => {
        render(
            <UserProvider>
                <UserContext.Consumer>
                    {value => <div>{value.apikeyData ? 'Data Exists' : 'No Data'}</div>}
                </UserContext.Consumer>
            </UserProvider>
        );

        expect(browserStorage.addListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should only accept valid children prop', () => {
        expect(() => {
            render(
                <UserProvider>
                    <div>Valid Child</div>
                </UserProvider>
            );
        }).not.toThrow();

        console.error = jest.fn();
        expect(() => {
            render(
                <UserProvider>
                    {null}
                </UserProvider>
            );
        }).not.toThrow();
        expect(console.error).toHaveBeenCalled();
    });

    it('should re-add onUpdate listener if no tabs are found or script execution fails', async () => {
        // Mock tabs.query to return no tabs
        chrome.tabs.query.mockResolvedValueOnce([]);

        chrome.scripting.executeScript.mockRejectedValueOnce(new Error('Failed'));

        await findTab([]);

        expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalledWith(onUpdate);
    });

    it('should execute script on tabs returned by query', async () => {
        // Mock tabs.query to return some tabs
        const tabs = [{ id: 1 }, { id: 2 }];
        chrome.tabs.query.mockResolvedValueOnce(tabs);

        chrome.scripting.executeScript.mockResolvedValueOnce();

        await findTab(tabs);

        expect(chrome.scripting.executeScript).toHaveBeenCalledWith({ target: { tabId: 1 }, func: connect });
        expect(chrome.tabs.onUpdated.removeListener).toHaveBeenCalledWith(onUpdate);
        expect(chrome.tabs.onUpdated.addListener).not.toHaveBeenCalled();
    });

    it('should handle chrome.runtime.lastError gracefully', async () => {
        chrome.runtime.lastError = 'Some error'; // Simulate an error

        chrome.tabs.query.mockResolvedValueOnce([]);

        await findTab();

        expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
        expect(chrome.tabs.onUpdated.removeListener).not.toHaveBeenCalled();
    });

    it('should handle errors during apikeyInfo.init gracefully', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        apikeyInfo.init.mockRejectedValueOnce(new Error('Initialization Failed'));

        render(
            <UserProvider>
                <UserContext.Consumer>
                    {value => <div>{value.apikeyData ? 'Data Exists' : 'No Data'}</div>}
                </UserContext.Consumer>
            </UserProvider>
        );

        await act(async () => {
            await apikeyInfo.init();
        });

        expect(consoleWarnSpy).toHaveBeenCalledWith(new Error('Initialization Failed'));
        expect(screen.getByText('No Data')).toBeInTheDocument();

        consoleWarnSpy.mockRestore();
    });

    it('should remove browserStorage listener on unmount', () => {
        const { unmount } = render(
            <UserProvider>
                <UserContext.Consumer>
                    {value => <div>{value.apikeyData ? 'Data Exists' : 'No Data'}</div>}
                </UserContext.Consumer>
            </UserProvider>
        );

        unmount();
        expect(browserStorage.removeListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should have apikeyData as null initially', () => {
        apikeyInfo.data = null;

        render(
            <UserProvider>
                <UserContext.Consumer>
                    {value => <div>{value.apikeyData === null ? 'No Data' : 'Data Exists'}</div>}
                </UserContext.Consumer>
            </UserProvider>
        );

        expect(screen.getByText('No Data')).toBeInTheDocument();
    });
});
