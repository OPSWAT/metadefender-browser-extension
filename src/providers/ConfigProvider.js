
import { createContext } from 'react';

import MCL from '../config/config';

export const ConfigContext = createContext();
export default ConfigContext;

export const ConfigProvider = ({ children }) => {

    return (
        <ConfigContext.Provider value={MCL.config}>
            {children}
        </ConfigContext.Provider>
    );
};
