import React, { useContext } from 'react';
import { render, act } from '@testing-library/react';
import { GAProvider, GAContext } from './GAProvider';
import { GaTrack } from '../services/ga-track';

// Mock the GaTrack service
jest.mock('../services/ga-track');

describe('GAProvider', () => {
    it('provides gaTrackEvent function to its children and calls GaTrack when gaTrackEvent is invoked', () => {
        const eventMock = { eventName: 'test_event' };

        // Create a test component to consume the context
        const TestComponent = () => {
            const { gaTrackEvent } = useContext(GAContext);

            // Call gaTrackEvent with a test event
            act(() => {
                gaTrackEvent(eventMock);
            });

            return <div>Test Component</div>;
        };

        // Render the TestComponent within GAProvider
        render(
            <GAProvider>
                <TestComponent />
            </GAProvider>
        );

        // Assert that GaTrack was called with the correct event
        expect(GaTrack).toHaveBeenCalledWith(eventMock);
    });
});
