
import { createContext, useContext, useState, useEffect } from 'react';

import { scanHistory } from '../services/common/persistent/scan-history';
import browserStorage from '../services/common/browser/browser-storage';

import ConfigContext from './ConfigProvider';

export const ScanHistoryContext = createContext();
export default ScanHistoryContext;

export const ScanHistoryProvider = ({ children }) => {

    const config = useContext(ConfigContext);
    const [files, setFiles] = useState([]);

    function storageUpdateHandler(changes) {
        const storageKey = config.storageKey.scanHistory;
        if (Object.keys(changes).includes(storageKey)) {
            scanHistory.merge(changes[storageKey].newValue);
            setFiles(scanHistory.files);
        }
    }

    function clearnScanHistory() {
        scanHistory.clear();
        setFiles(scanHistory.files);
    }

    function removeScanHistoryFile(file) {
        scanHistory.removeFile(file);
        setFiles(scanHistory.files);
    }

    useEffect(() => {
        (async () => {
            try {
                await scanHistory.init();
                setFiles(scanHistory.files);
            } catch (error) {
                console.warn(error);
            }
        })();

        browserStorage.addListener(storageUpdateHandler);

        return () => {
            browserStorage.removeListener(storageUpdateHandler);
        };
    }, []);


    return (
        <ScanHistoryContext.Provider value={{
            files, 
            clearnScanHistory, 
            removeScanHistoryFile
        }}>
            {children}
        </ScanHistoryContext.Provider>
    );
};
