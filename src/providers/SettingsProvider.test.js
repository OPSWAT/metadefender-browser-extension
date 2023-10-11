import { render, act } from '@testing-library/react';
import React from 'react';
import { validateCoreSettings, SettingsProvider } from './SettingsProvider'

import CoreClient from '../services/common/core-client';

// Mocking modules and global functions
jest.mock('../services/common/core-client');
jest.mock('../services/common/browser/browser-notification');

describe('SettingsProvider', () => {
    
    it('renders children', () => {
        const { getByText } = render(
            <SettingsProvider>
                <div>Test Child</div>
            </SettingsProvider>
        );
        expect(getByText('Test Child')).toBeInTheDocument();
    });

});

describe('validateCoreSettings', () => {
    
    beforeEach(() => {
        CoreClient.configure.mockClear();
        CoreClient.version.mockClear();
        CoreClient.rules.mockClear();
    });
    
    it('calls CoreClient methods with correct parameters', async () => {
        const newApikey = 'newApikey';
        const newUrl = 'newUrl';
        
        CoreClient.version.mockResolvedValue({ version: '4.0.0' });
        CoreClient.rules.mockResolvedValue([{ name: 'rule1' }]);
        
        await validateCoreSettings(newApikey, newUrl);
        
        expect(CoreClient.configure).toHaveBeenCalledWith({
            apikey: newApikey,
            endpoint: newUrl,
        });
        expect(CoreClient.version).toHaveBeenCalled();
        expect(CoreClient.rules).toHaveBeenCalledWith('');
    });

    it('returns expected data if CoreClient methods resolve', async () => {
        const newApikey = 'newApikey';
        const newUrl = 'newUrl';
        
        CoreClient.version.mockResolvedValue({ version: '4.0.0' });
        CoreClient.rules.mockResolvedValue([{ name: 'rule1' }]);
        
        const result = await validateCoreSettings(newApikey, newUrl);
        
        expect(result).toEqual({
            coreV4: true,
            rules: ['rule1'],
        });
    });
    
    it('returns false if CoreClient methods reject', async () => {
        CoreClient.version.mockRejectedValue(new Error('An error occurred.'));
        
        const result = await validateCoreSettings('apikey', 'url');
        
        expect(result).toEqual(false);
    });

    it('returns coreV4 as false if API version is not 4.x.x', async () => {
        CoreClient.version.mockResolvedValue({ version: '3.0.0' });
        CoreClient.rules.mockResolvedValue([{ name: 'rule1' }]);
        
        const result = await validateCoreSettings('apikey', 'url');
        
        expect(result.coreV4).toBe(undefined);
    });

    it('returns empty rules if API provides no rules', async () => {
        CoreClient.version.mockResolvedValue({ version: '4.0.0' });
        CoreClient.rules.mockResolvedValue([]);
        
        const result = await validateCoreSettings('apikey', 'url');
        
        expect(result.rules).toEqual([]);
    });
    
});