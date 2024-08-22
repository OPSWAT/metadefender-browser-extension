import React from 'react';

const CheckboxData = (isPaidUser, isAllowedFileSchemeAccess) => {
    return [
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('scanDownloads') }} />,
            otherContent: <>
                <p>
                    {chrome.i18n.getMessage('fileAccessDisabled')}
                    {' '}
                    <a href="" onClick={() => {
                        chrome.tabs.query({ url: `chrome://extensions/?id=${chrome.runtime.id.toString()}` }, (tabs) => {
                            if (tabs.length === 0) {
                                chrome.tabs.update({ url: `chrome://extensions/?id=${chrome.runtime.id.toString()}` });
                            }
                            else {
                                chrome.tabs.update(tabs[0].id, { active: true });
                            }
                        });
                    }}>
                        {chrome.i18n.getMessage('goToExtension')}
                    </a>

                </p>
                <sub className='warning'>{chrome.i18n.getMessage('scanDownloadsSub')}</sub>
            </>,
            isDisabled: !isAllowedFileSchemeAccess,
            labelFor: 'scanDownloads'
        },
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('shareResults') }} />,
            otherContent: <sub dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('shareResultsSub') }} />,
            labelFor: 'shareResults',
            isDisabled: !isPaidUser
        },
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('showNotifications') }} />,
            labelFor: 'showNotifications'
        },
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('saveCleanFiles') }} />,
            labelFor: 'saveCleanFiles'
        },
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('safeUrl') }} />,
            otherContent: <sub dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('safeUrlSub') }} />,
            labelFor: 'safeUrl'
        },
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('skipLimit') }} />,
            labelFor: 'skipLimit'
        },
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('useCustomApiKey') }} />,
            hasFormApikey: true,
            labelFor: 'useCustomApiKey'
        },
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('useCore') }} />,
            hasForm: true,
            labelFor: 'useCore'
        },
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('useWhiteList') }} />,
            hasFormWhiteList: true,
            labelFor: 'useWhiteList'
        },
    ];
};

export default CheckboxData;