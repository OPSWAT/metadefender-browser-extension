import React from 'react';

const CheckboxData = (isPaidUser, isManaged) => {
    return [
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('scanDownloads') }} />,
            isDisabled: isManaged,
            labelFor: 'scanDownloads'
        },
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('shareResults') }} />,
            otherContent: <sub dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('shareResultsSub') }} />,
            labelFor: 'shareResults',
            isDisabled: isManaged || !isPaidUser
        },
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('showNotifications') }} />,
            labelFor: 'showNotifications',
            isDisabled: isManaged
        },
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('saveCleanFiles') }} />,
            labelFor: 'saveCleanFiles',
            isDisabled: isManaged
        },
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('safeUrl') }} />,
            otherContent: <sub dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('safeUrlSub') }} />,
            labelFor: 'safeUrl',
            isDisabled: isManaged
        },
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('skipLimit') }} />,
            labelFor: 'skipLimit',
            isDisabled: isManaged
        },
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('useCustomApiKey') }} />,
            hasFormApikey: true,
            labelFor: 'useCustomApiKey',
            isDisabled: isManaged
        },
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('useCore') }} />,
            hasForm: true,
            labelFor: 'useCore',
            isDisabled: isManaged
        },
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('useWhiteList') }} />,
            hasFormWhiteList: true,
            labelFor: 'useWhiteList',
            isDisabled: isManaged
        },
    ];
};

export default CheckboxData;