import MetascanClient from "../../../services/common/metascan-client";
import { apikeyInfo } from "../../../services/common/persistent/apikey-info";

export const sendDomainToApi = async () => {
    chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
        const tab = tabs[0];
        const domain = new URL(tab.url).hostname;
        console.log(domain);

        let response
        await apikeyInfo.load();
        if (!apikeyInfo.data.apikey) {
            BrowserNotification.create(chrome.i18n.getMessage('undefinedApiKey'));
            return;
        }
        try {
            console.log('apikeyInfo', apikeyInfo)
            response = await MetascanClient.setAuth(apikeyInfo.data.apikey)?.domain?.lookup(domain);
            console.log(response);
        } catch (error) {
            console.log('err', error);
        }

    })
}

