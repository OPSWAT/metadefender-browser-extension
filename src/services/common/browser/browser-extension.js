'use strict';



const browserExtension = {
    isAllowedFileSchemeAccess
};
export default browserExtension;

/**
 * Promisify chrome API: `extension.isAllowedFileSchemeAccess`.
 * 
 * @link https://developer.chrome.com/extensions/extension#method-isAllowedFileSchemeAccess
 */
function isAllowedFileSchemeAccess(){
    return new Promise((resolve) => {
        chrome.extension.isAllowedFileSchemeAccess((isAllowedAccess) => {
            resolve(isAllowedAccess);
        });
    });
}
