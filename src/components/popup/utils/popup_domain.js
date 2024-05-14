import MetascanClient from "../../../services/common/metascan-client";
import { apikeyInfo } from "../../../services/common/persistent/apikey-info";

export const sendDomainToApi = async () => {
    return new Promise(async (resolve, reject) => {
        chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
            const tab = tabs[0];
            const domain = new URL(tab.url).hostname;
            console.log(domain);

            await apikeyInfo.load();
            if (!apikeyInfo.data.apikey) {
                BrowserNotification.create(chrome.i18n.getMessage('undefinedApiKey'));
                reject(new Error('Undefined API key'));
                return;
            }
            try {
                const response = await MetascanClient.setAuth(apikeyInfo.data.apikey)?.domain?.lookup(domain);
                console.log(response.lookup_results.sources);
                resolve(response);
            } catch (error) {
                console.log('err', error);
                reject(error);
            }
        });
    });
};


