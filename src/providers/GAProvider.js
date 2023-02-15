
import { createContext } from 'react';
import { GaTrack } from '../services/ga-track';

export const GAContext = createContext();
export default GAContext;

export const GAProvider = ({ children }) => {

    const gaTrackEvent = (event) => {
        GaTrack(event);
    };

    return (
        <GAContext.Provider value={{
            gaTrackEvent
        }}>
            {children}
        </GAContext.Provider>
    );
};
