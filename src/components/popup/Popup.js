
import classNames from 'classnames';
import React, { useEffect, useMemo, useContext, useState } from 'react';
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
    const [dropOverlayActive, setDropOverlayActive] = useState(false);


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

    const getRelativeScanTime = (timestamp) => {
        const timeDifference = (Math.floor(Date.now() / 1000) - timestamp);

        const intervals = [
            {label: 'year', seconds: 31536000 },
            {label: 'month', seconds: 2592000},
            {label: 'day', seconds: 86400},
            {label: 'hour', seconds: 3600},
            {label: 'minute', seconds: 60},
            {label: 'second', seconds: 1}
        ]

        for (let i = 0; i < intervals.length; i++) {
            const count = Math.floor(timeDifference / intervals[i].seconds);
            if(count >= 1) {
                return `${count} ${intervals[i].label}${count !== 1 ? 's' : ''} ago`;

            }
        }

        return 'just now';
    };

    const goToHistory = () => {
        handleGaTrack();
        goToTab('history');
        window.close();
    };

    const goToSettings = () => {
        handleGaTrack();
        goToTab('settings');
        window.close();
    };

    const dropOverlay = useMemo(() => {
        return (
            <div className="drop-overlay"></div>
        );
    }, [dropOverlayActive]);

    const handleDragAndDrop = (event) => {
        event.preventDefault();
        event.stopPropagation(); 
        console.log(event.type);
        if (event.type === 'dragover') {
            setDropOverlayActive(true);
        } else if (event.type === 'drop') {
            const file = event.dataTransfer.files[0];
            setDropOverlayActive(false);
            console.log(file);
        }
    };

    

    useEffect(() => {
        gaTrackEvent(['_trackPageview', '/extension/popup']);
    }, []);

    const viewScanHistoryClassName = classNames({ 'd-none': files.length === 0 }, 'popup--scan__footer');

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
        
        
        const tableRows = files.slice(0, 3).map((scannedFile, index) => {
            console.log(scannedFile);
            return (
            <tr key={index} className="list-group-item d-flex align-items-center justify-content-between">
                <td>
                        <a href={scannedFile.scanResults || getScanUrl(scannedFile)} target="_blank" rel="noreferrer noopener">
                            {scannedFile.fileName}
                        </a>
                        <span>
                            {scannedFile.dataId}
                        </span>
                </td>
                <td>
                    {getRelativeScanTime(scannedFile.scanTime)}
                </td>
                <td>
                    <span className={`mcl-icon ${getStatusIcon(scannedFile.status)}`}></span>
                </td>
            </tr>
            );
        });

        return (
            <tbody>
                {tableRows}
            </tbody>
        )
    }, [files]);

    const scanResults = useMemo(() => {
        if (files.length === 0) {
            return <ul className="list-group">
                <li className="list-group-item">
                    <span dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('noScansNotification') }} />
                </li>
            </ul>;
        }

        return <table className="list-group row">
                    <thead>
                        <tr>
                            <td>FILE NAME</td>
                            <td>SCAN TIME</td>
                            <td>RESULT</td>
                        </tr>
                    </thead>
                    
            {scanResultsDom}
            
        </table>;
    }, [files, scanResultsDom]);

    const dropFile = useMemo(() => {
        return <div className="dnd-bar" >
                    <i className="icon-drop"></i>
                    <span className="text" dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('dropFile') }} />
            </div>;
    })

    return <div className="popup--wrapper" onDrop={handleDragAndDrop} onDragOver={handleDragAndDrop}>
    <div className={`drop-overlay ${dropOverlayActive ? 'active' : ''}`}></div>
        <div className="popup--header">
            <div className="popup--header__logo"></div>
                <div className="popup--header__buttons">
                    <a href='#' className={classNames("popup--header__btn", viewScanHistoryClassName)} onClick={goToHistory}>
                        <span className="icon-history text-14"></span>
                    </a>
                    <a href='#' className="popup--header__btn" onClick={goToSettings}>
                        <span className="icon-cog text-14"></span>
                    </a>
                </div>
        </div>

        <div className="popup--scan__history">
            {scanResults}
        </div>

        <div className="popup--drop__file text-right">
            {dropFile}
        </div>
    </div>;
};

export default Popup;
