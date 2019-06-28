/**
 * Navigate to an extension page.
 * If the tab is already open, switch to it otherwise open a new browser tab.
 * 
 * @param {string} tabName 
*/
export const goToTab = function(tabName) {
    let extensionId = chrome.runtime.id.toString();
    let extensionUrl = 'chrome-extension://' + extensionId + '/html/extension.html#!/';
    let activeTab = '';
    let queryInfo = {
        title: chrome.i18n.getMessage('appName')
    };
    chrome.tabs.query(queryInfo, (tabs) => {
        let openedTab = null;
        for (let tab of tabs) {
            if (tab.url.indexOf(extensionUrl) === 0) {
                openedTab = tab;
                activeTab = tab.url.replace(extensionUrl, '');
                if (activeTab === tabName) {
                    break;
                }
            }
        }

        if (openedTab) {
            if (activeTab !== tabName) {
                chrome.tabs.update(openedTab.id, { active: true, url: extensionUrl + tabName });
            }
            else {
                chrome.tabs.update(openedTab.id, { active: true });
            }
        }
        else {
            chrome.tabs.create({ active: true, url: extensionUrl + tabName });
        }
    });
};