import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import SettingsContext, { SettingsProvider, validateCoreSettings, validateCustomApikey } from './SettingsProvider';
import CoreClient from '../services/common/core-client';
import ConfigContext from './ConfigProvider';

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

// Mock ConfigContext
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
        const { getByText } = renderWithConfig(
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
            expect(screen.getByTestId('settings-available')).toBeInTheDocument();
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
});


