import { domainHistory } from "../services/common/persistent/domain-history";
import browserStorage from "../services/common/browser/browser-storage";

import ConfigContext from "./ConfigProvider";
import { createContext, useContext, useEffect, useState } from "react";

export const DomainHistoryContext = createContext();
export default DomainHistoryContext;

export const DomainHistoryProvider = ({ children }) => {

    const config = useContext(ConfigContext);
    const [domains, setDomains] = useState([]);

    function storageUpdateHandler(changes) {
        const storageKey = config.storageKey.domainHistory;
        if(Object.keys(changes).includes(storageKey)) {
            domainHistory.merge(changes[storageKey].newValue);
            setDomains(domainHistory.domains);
        }
    }

    function clearDomainHistory() {
        domainHistory.clear();
        setDomains(domainHistory.domains);
    }

    function removeDomainHistoryDomain(domain) {
        domainHistory.removeDomain(domain);
        setDomains(domainHistory.domains);
    }

    useEffect(() => {
        (async () =>{
            try {
                await domainHistory.init();
                setDomains(domainHistory.domains);
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
        <DomainHistoryContext.Provider value={{
            domains,
            clearDomainHistory,
            removeDomainHistoryDomain
        }}>
            {children}
        </DomainHistoryContext.Provider>
    );
};