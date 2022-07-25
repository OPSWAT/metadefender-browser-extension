import React from 'react';

const CheckboxData = [
    {
        label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('scanDownloads') }} />,
        otherContent: <sub className='warning'>{chrome.i18n.getMessage('scanDownloadsSub')}</sub>,
        isDisabled: true,
        labelFor: 'scanDownloads'
    },
    {
        label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('shareResults') }} />,
        otherContent: <sub dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('shareResultsSub') }} />,
        isDisabled: true,
        labelFor: 'shareResults'
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
        label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('useCore') }} />,
        hasForm: true,
        labelFor: 'useCore'
    },
];

export default CheckboxData;