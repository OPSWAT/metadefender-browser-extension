
import classNames from 'classnames';
import React, { useEffect, useMemo, useContext } from 'react';
import GAContext from '../../providers/GAProvider';
import ConfigContext from '../../providers/ConfigProvider';
import { goToTab } from '../../services/background/navigation';
import ScanFile from '../../services/common/scan-file';
import ScanHistoryContext from '../../providers/ScanHistoryProvider';

import './Popup.scss';

const Popup = () => {

    const config = useContext(ConfigContext);
    const { gaTrackEvent } = useContext(GAContext);
    const { files } = useContext(ScanHistoryContext);
    const scanUrl = config.mclDomain;

    /**
     * Send google analytics data on click event
     */
    const handleGaTrack = () => {
        gaTrackEvent(['_trackEvent', config.gaEventCategory.name, config.gaEventCategory.action.linkClicked, config.gaEventCategory.label.scanHistory, config.gaEventCategory.label.scanHistory]);
    };

    /**  
     * Get the icon for the file's current status (clean / infected / scanning / unknown)
     * @param {number} fileStatus (0 / 1 / 2 / 3) <-> (scanning / clean / infected / unknown)
     * @returns {string} The icon class
    */
    const getStatusIcon = (fileStatus) => {
        if (fileStatus == ScanFile.STATUS.CLEAN) {
            return 'icon-ok';
        }

        if (fileStatus == ScanFile.STATUS.INFECTED) {
            return 'icon-cancel';
        }

        if (fileStatus == ScanFile.STATUS.SCANNING) {
            return 'icon-spin animate-spin';
        }

        return 'icon-help';
    };

    /** Open a new tab with the full scan history */
    const goToHistory = () => {
        handleGaTrack();
        goToTab('history');
        window.close();
    };

    /** Open a new tab with the settings */
    const goToSettings = () => {
        handleGaTrack();
        goToTab('settings');
        window.close();
    };

    useEffect(() => {
        gaTrackEvent(['_trackPageview', '/extension/popup']);
    }, []);

    const viewScanHistoryClassName = classNames({ 'd-none': files.length === 0 }, 'popup--scan__footer text-right');

    const getScanUrl = (file) => {
        if (file.dataId) {
            return `${scanUrl}/results/file/${file.dataId}/regular/peinfo`;
        }

        return `${scanUrl}/results/file/${file.md5}/hash/peinfo`;
    };

    const scanResultsDom = useMemo(() => {
        if (files.length === 0) {
            return;
        }

        return files.slice(0, 3).map((scannedFile, index) => (
            <li key={index} className="list-group-item d-flex align-items-center justify-content-between">
                <a href={scannedFile.scanResults || getScanUrl(scannedFile)} target="_blank" rel="noreferrer noopener">
                    {scannedFile.fileName}
                </a>
                <span data-testid={getStatusIcon(scannedFile.status)} className={`mcl-icon ${getStatusIcon(scannedFile.status)}`}></span>
            </li >
        ));
    }, [files]);

    const scanResults = useMemo(() => {
        if (files.length === 0) {
            return <ul className="list-group">
                <li className="list-group-item">
                    <span dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('noScansNotification') }} />
                </li>
            </ul>;
        }

        return <ul className="list-group row">
            {scanResultsDom}
        </ul>;
    }, [files, scanResultsDom]);

    return <div className="popup--wrapper">
        <div className="popup--header">
            <div className="popup--header__logo"></div>
            <button className="popup--header__btn" onClick={goToSettings}>
                <span className="icon-cog text-14"></span>
            </button>
        </div>

        <div className="popup--scan__history">
            {scanResults}
        </div>

        <div className={viewScanHistoryClassName}>
            <button className='buttonCustom' onClick={goToHistory}>
                View Scan History
                <span className="mcl-icon icon-right"></span>
            </button>
        </div>
    </div>;
};

export default Popup;
