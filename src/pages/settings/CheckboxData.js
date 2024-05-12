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
                        chrome.tabs.query({url: `chrome://extensions/?id=${chrome.runtime.id.toString()}`}, (tabs) => {
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
                <sub className='warning'>{chrome.i18n.getMessage('scanSub')}</sub>
            </>,
            isDisabled: !isAllowedFileSchemeAccess,
            labelFor: 'scanDownloads'
        },
        {
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('scanUploads') }} />,
            otherContent: <>
                <p>
                    {chrome.i18n.getMessage('fileAccessDisabled')}
                    {' '}
                    <a href="" onClick={() => {
                        chrome.tabs.query({url: `chrome://extensions/?id=${chrome.runtime.id.toString()}`}, (tabs) => {
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
                <sub className='warning'>{chrome.i18n.getMessage('scanSub')}</sub>
            </>,
            isDisabled: !isAllowedFileSchemeAccess,
            labelFor: 'scanUploads'
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
            label: <p className='label' dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('useCore') }} />,
            hasForm: true,
            labelFor: 'useCore'
        },
    ];
};

export default CheckboxData;