import React, { useContext } from 'react';
import { render } from '@testing-library/react';
import { ConfigProvider, ConfigContext } from './ConfigProvider';

// Mock the MCL module to control the config in the test
jest.mock('../config/config', () => ({
    config: {
        apiUrl: 'https://test.api.url',
        featureToggle: true,
    }
}));

describe('ConfigProvider', () => {
    it('provides the correct config value to its children', () => {
        // Create a test component to consume the context
        const TestComponent = () => {
            const config = useContext(ConfigContext);

            // Render some content based on the config
            return (
                <div>
                    <span data-testid="apiUrl">{config.apiUrl}</span>
                    <span data-testid="featureToggle">{config.featureToggle ? 'enabled' : 'disabled'}</span>
                </div>
            );
        };

        // Render the TestComponent within ConfigProvider
        const { getByTestId } = render(
            <ConfigProvider>
                <TestComponent />
            </ConfigProvider>
        );

        // Assert that the context values match the mocked MCL.config
        expect(getByTestId('apiUrl').textContent).toBe('https://test.api.url');
        expect(getByTestId('featureToggle').textContent).toBe('enabled');
    });
});
