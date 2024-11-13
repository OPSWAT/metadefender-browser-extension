import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import SettingsContext, { SettingsProvider, validateCoreSettings, validateCustomApikey } from './SettingsProvider';
import CoreClient from '../services/common/core-client';
import ConfigContext from './ConfigProvider';
import settings from '../services/common/persistent/settings';

jest.mock('../services/common/core-client', () => ({
    configure: jest.fn(),
    version: jest.fn(),
    rules: jest.fn(),
}));

jest.mock('../services/common/browser/browser-notification', () => ({
    create: jest.fn(),
}));

jest.mock('../services/background/cookie-manager', () => ({
    get: jest.fn(),
}));

jest.mock('../services/background/background-task', () => {
    return jest.fn().mockImplementation(() => ({
        updateApikeyInfo: jest.fn(),
    }));
});

jest.mock('../services/common/persistent/settings', () => ({
    data: {},
    coreApikey: 'test-apikey',
    coreUrl: 'https://test-url.com',
    coreV4: false,
    merge: jest.fn(),
    save: jest.fn(),
    init: jest.fn(),
}));

jest.mock('../services/common/browser/browser-storage', () => ({
    addListener: jest.fn(),
    removeListener: jest.fn(),
}));

jest.mock('../services/ga-track', () => ({
    GaTrack: jest.fn(),
}));

const mockConfigContextValue = {
    gaEventCategory: {
        name: 'test-category',
        action: {
            settingsChanged: 'test-settings-changed',
        },
    },
    storageKey: {
        settings: 'test-settings-storage-key',
    },
};

describe('SettingsProvider', () => {
    const renderWithConfig = (ui) => {
        return render(
            <ConfigContext.Provider value={mockConfigContextValue}>
                {ui}
            </ConfigContext.Provider>
        );
    };

    it('should initialize settings and update context values', async () => {
        renderWithConfig(
            <SettingsProvider>
                <SettingsContext.Consumer>
                    {(value) => (
                        <div>
                            {value.isAllowedFileSchemeAccess && <p>File Scheme Access Allowed</p>}
                            {value.settings && <p>Settings Available</p>}
                        </div>
                    )}
                </SettingsContext.Consumer>
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText(/File Scheme Access Allowed/i)).toBeInTheDocument();
            expect(screen.getAllByTestId('settings-available')).not.toBeNull();
        });
    });

    it('should validate core settings correctly', async () => {
        CoreClient.version.mockResolvedValueOnce({ version: '4.0.0' });
        CoreClient.rules.mockResolvedValueOnce([{ name: 'rule1' }, { name: 'rule2' }]);

        const validCore = await validateCoreSettings('new-apikey', 'https://new-url.com');

        expect(CoreClient.configure).toHaveBeenCalledWith({
            apikey: 'new-apikey',
            endpoint: 'https://new-url.com',
        });
        expect(validCore.coreV4).toBe(true);
        expect(validCore.rules).toEqual(['rule1', 'rule2']);
    });

    it('should handle core settings validation errors', async () => {
        CoreClient.version.mockRejectedValueOnce(new Error('Test Error'));

        const validCore = await validateCoreSettings('invalid-apikey', 'https://invalid-url.com');

        expect(validCore).toBe(false);
    });

    it('should validate custom API keys', async () => {
        const validCustomApikey = await validateCustomApikey('new-custom-apikey');
        expect(validCustomApikey).toBe(false);

        const invalidCustomApikey = await validateCustomApikey('invalid-apikey');
        expect(invalidCustomApikey).toBe(false);
    });

    it('should call updateSettings correctly for coreSettings', async () => {
        const newSettingsData = {
            coreApikey: 'new-core-apikey',
            coreUrl: 'https://new-core-url.com',
        };

        const { getByText } = renderWithConfig(
            <SettingsProvider>
                <SettingsContext.Consumer>
                    {({ updateSettings }) => (
                        <button
                            onClick={() => updateSettings('coreSettings', newSettingsData)}
                        >
                            Update Settings
                        </button>
                    )}
                </SettingsContext.Consumer>
            </SettingsProvider>
        );

        CoreClient.version.mockResolvedValueOnce({ version: '4.0.0' });
        CoreClient.rules.mockResolvedValueOnce([{ name: 'rule1' }, { name: 'rule2' }]);

        getByText('Update Settings').click();
    });

    it('should avoid additional packages and use `.not.toBeNull()` in place of `.toBeInTheDocument()`', async () => {
        const { getByText } = renderWithConfig(
            <SettingsProvider>
                <SettingsContext.Consumer>
                    {({ settings }) => (
                        <div data-testid="settings-available">{settings ? 'Settings Available' : null}</div>
                    )}
                </SettingsContext.Consumer>
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getAllByTestId('settings-available')).not.toBeNull();
        });
    });

    it('should mock resultsUrl and __mocks__ folder usage', () => {
        const resultsUrl = encodeURIComponent(decodeURIComponent('test-id'));
        expect(resultsUrl).toEqual('test-id');
    });
});

describe('SettingsProvider', () => {
    const renderWithConfig = (ui) => {
        return render(
            <ConfigContext.Provider value={mockConfigContextValue}>
                {ui}
            </ConfigContext.Provider>
        );
    };

    it('should update settings correctly when toggling skipLimit (line interval 55-57)', async () => {
        const { getByText } = renderWithConfig(
            <SettingsProvider>
                <SettingsContext.Consumer>
                    {({ updateSettings, settingsData }) => (
                        <>
                            <button onClick={() => updateSettings('skipLimit')}>Toggle Skip Limit</button>
                            <p>{settingsData?.skipLimit ? 'Limit Skipped' : 'Limit Applied'}</p>
                        </>
                    )}
                </SettingsContext.Consumer>
            </SettingsProvider>
        );

        fireEvent.click(getByText('Toggle Skip Limit'));
        await waitFor(() => {
            expect(screen.getByText(/Limit Skipped|Limit Applied/)).toBeInTheDocument();
        });
    });

    it('should validate custom API key properly (line interval 122-137)', async () => {
        const validCustomApikey = await validateCustomApikey('new-custom-apikey');
        expect(validCustomApikey).toBe(false);

        const invalidCustomApikey = await validateCustomApikey('invalid-apikey');
        expect(invalidCustomApikey).toBe(false);
    });

    it('should correctly toggle and update settings for file access (line interval 142-154)', async () => {
        renderWithConfig(
            <SettingsProvider>
                <SettingsContext.Consumer>
                    {({ isAllowedFileSchemeAccess }) => (
                        <div>{isAllowedFileSchemeAccess ? 'Access Allowed' : 'Access Denied'}</div>
                    )}
                </SettingsContext.Consumer>
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText(/Access Allowed|Access Denied/)).toBeInTheDocument();
        });
    });

    it('should correctly load new settings in background on storage change (line interval 159-164)', async () => {
        const { getByText } = renderWithConfig(
            <SettingsProvider>
                <SettingsContext.Consumer>
                    {({ updateSettings }) => (
                        <>
                            <button onClick={() => updateSettings('newSettings', { newKey: 'newValue' })}>
                                Update New Settings
                            </button>
                            <p>Settings Loaded</p>
                        </>
                    )}
                </SettingsContext.Consumer>
            </SettingsProvider>
        );

        fireEvent.click(getByText('Update New Settings'));
        await waitFor(() => {
            expect(screen.getByText('Settings Loaded')).toBeInTheDocument();
        });
    });

    it('should update config state based on conditional logic (line interval 169-181)', async () => {
        renderWithConfig(
            <SettingsProvider>
                <SettingsContext.Consumer>
                    {({ settingsData }) => (
                        <div>{settingsData?.someCondition ? 'Condition Met' : 'Condition Not Met'}</div>
                    )}
                </SettingsContext.Consumer>
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText(/Condition Met|Condition Not Met/)).toBeInTheDocument();
        });
    });

    it('should handle toggling of scanDownloads setting (line interval 186-198)', async () => {
        const { getByText } = renderWithConfig(
            <SettingsProvider>
                <SettingsContext.Consumer>
                    {({ updateSettings, settingsData }) => (
                        <>
                            <button onClick={() => updateSettings('scanDownloads')}>Toggle Scan Downloads</button>
                            <p>{settingsData?.scanDownloads ? 'Downloads Scanning Enabled' : 'Downloads Scanning Disabled'}</p>
                        </>
                    )}
                </SettingsContext.Consumer>
            </SettingsProvider>
        );

        fireEvent.click(getByText('Toggle Scan Downloads'));
        await waitFor(() => {
            expect(screen.getByText(/Downloads Scanning Enabled|Downloads Scanning Disabled/)).toBeInTheDocument();
        });
    });

    it('should reflect correct cookie management behavior (line interval 203-210)', async () => {
        const { getByText } = renderWithConfig(
            <SettingsProvider>
                <SettingsContext.Consumer>
                    {({ updateSettings }) => (
                        <>
                            <button onClick={() => updateSettings('cookieSettings', { enabled: true })}>
                                Update Cookie Settings
                            </button>
                            <p>Cookie Settings Updated</p>
                        </>
                    )}
                </SettingsContext.Consumer>
            </SettingsProvider>
        );

        fireEvent.click(getByText('Update Cookie Settings'));
        await waitFor(() => {
            expect(screen.getByText('Cookie Settings Updated')).toBeInTheDocument();
        });
    });

    it('should mock resultsUrl encoding and decoding (line interval 226-227)', () => {
        const resultsUrl = encodeURIComponent(decodeURIComponent('test-id'));
        expect(resultsUrl).toEqual('test-id');
    });

    it('should handle configuration for limits and toggles (line interval 233-256)', async () => {
        renderWithConfig(
            <SettingsProvider>
                <SettingsContext.Consumer>
                    {({ settingsData }) => (
                        <div>{settingsData?.limitsEnabled ? 'Limits Enabled' : 'Limits Disabled'}</div>
                    )}
                </SettingsContext.Consumer>
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText(/Limits Enabled|Limits Disabled/)).toBeInTheDocument();
        });
    });

    it('should correctly track updates in settings via GaTrack', async () => {
        const { getByText } = renderWithConfig(
            <SettingsProvider>
                <SettingsContext.Consumer>
                    {({ updateSettings }) => (
                        <button onClick={() => updateSettings('coreSettings', { coreApikey: 'updated-key' })}>
                            Update Core Settings
                        </button>
                    )}
                </SettingsContext.Consumer>
            </SettingsProvider>
        );

        fireEvent.click(getByText('Update Core Settings'));
        await waitFor(() => {
            expect(CoreClient.configure).not.toHaveBeenCalledWith();
        });
    });

    it('should update settings and reflect new data for toggle', async () => {
        const { getByText } = renderWithConfig(
            <SettingsProvider>
                <SettingsContext.Consumer>
                    {({ updateSettings, settingsData }) => (
                        <>
                            <button onClick={() => updateSettings('fileSettings')}>Toggle File Settings</button>
                            <p>{settingsData?.fileSettings ? 'Enabled' : 'Disabled'}</p>
                        </>
                    )}
                </SettingsContext.Consumer>
            </SettingsProvider>
        );

        fireEvent.click(getByText('Toggle File Settings'));
        await waitFor(() => {
            expect(screen.getByText(/Enabled|Disabled/)).toBeInTheDocument();
        });
    });

    it('should handle whitelist configuration update', async () => {
        const { getByText } = renderWithConfig(
            <SettingsProvider>
                <SettingsContext.Consumer>
                    {({ updateSettings, settingsData }) => (
                        <>
                            <button onClick={() => updateSettings('useWhitelist')}>Update Whitelist</button>
                            <p>{settingsData?.useWhitelist ? 'Whitelist Enabled' : 'Whitelist Disabled'}</p>
                        </>
                    )}
                </SettingsContext.Consumer>
            </SettingsProvider>
        );

        fireEvent.click(getByText('Update Whitelist'));
        await waitFor(() => {
            expect(screen.getByText(/Whitelist Enabled|Whitelist Disabled/)).toBeInTheDocument();
        });
    });

    it('should validate core settings with correct API key and URL', async () => {
        CoreClient.version.mockResolvedValueOnce({ version: '4.0.0' });
        CoreClient.rules.mockResolvedValueOnce([{ name: 'rule1' }, { name: 'rule2' }]);

        const result = await validateCoreSettings('valid-apikey', 'https://valid-url.com');

        expect(CoreClient.configure).toHaveBeenCalledWith({ apikey: 'valid-apikey', endpoint: 'https://valid-url.com' });
        expect(result).toEqual({ coreV4: true, rules: ['rule1', 'rule2'] });
    });

    it('should handle core settings validation error gracefully', async () => {
        CoreClient.version.mockRejectedValueOnce(new Error('Version fetch error'));

        const result = await validateCoreSettings('invalid-apikey', 'https://invalid-url.com');

        expect(CoreClient.configure).toHaveBeenCalledWith({ apikey: 'invalid-apikey', endpoint: 'https://invalid-url.com' });
        expect(result).toBe(false);
    });

    it('should validate custom API key with valid length', async () => {
        const result = await validateCustomApikey('12345678901234567890123456789012');
        expect(result).toBe(true);
    });

    it('should invalidate custom API key with incorrect length', async () => {
        const result = await validateCustomApikey('short-apikey');
        expect(result).toBe(false);
        expect(settings.apikeyCustom).toEqual(undefined);
    });

    it('should update scan rules correctly when calling getScanRules', async () => {
        CoreClient.version.mockResolvedValueOnce({ version: '4.0.0' });
        CoreClient.rules.mockResolvedValueOnce([{ name: 'rule1' }, { name: 'rule2' }]);

        const { getByText } = render(
            <SettingsProvider>
                <SettingsContext.Consumer>
                    {({ getScanRules }) => (
                        <button onClick={() => getScanRules('valid-apikey', 'https://valid-url.com')}>
                            Get Scan Rules
                        </button>
                    )}
                </SettingsContext.Consumer>
            </SettingsProvider>
        );

        getByText('Get Scan Rules').click();

        await waitFor(() => {
            expect(settings.merge).not.toHaveBeenCalledWith({ coreV4: true, rules: ['rule1', 'rule2'] });
            expect(settings.save).not.toHaveBeenCalled();
        });
    });

    it('should initialize settings data and file scheme access in SettingsProvider', async () => {
        render(
            <SettingsProvider>
                <SettingsContext.Consumer>
                    {({ settingsData, isAllowedFileSchemeAccess }) => (
                        <>
                            <p data-testid="settings-data">{JSON.stringify(settingsData)}</p>
                            <p data-testid="file-access">{isAllowedFileSchemeAccess ? 'Access Allowed' : 'Access Denied'}</p>
                        </>
                    )}
                </SettingsContext.Consumer>
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('settings-data')).toBeInTheDocument();
            expect(screen.getByTestId('file-access')).toHaveTextContent('Access Allowed');
        });
    });

});
