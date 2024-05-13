import React, { useState } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

const ScanHistoryTableRow = ({ fileName, scanUrl, hash, scanTime, results, removeFile, status, getStatusIcon, useCore, useDLP }) => {
    const [isTrashDisplayed, setIsTrashDisplayed] = useState(false);
    const [isDownloadDisplayed, setIsDownloadDisplayed] = useState(false);
    const trashClassName = classNames({
        'invisible': !isTrashDisplayed
    }, 'mcl-icon icon-trash');

    const downloadClassName = classNames({
        'invisible': !isDownloadDisplayed
    }, 'mcl-icon icon-download-cloud');

    const cleanClassName = classNames({
        'noThreatsFound': results === 'No threats found'
    });


    return <tr
        onMouseEnter={() => {setIsTrashDisplayed(true); setIsDownloadDisplayed(true)}}
        onMouseLeave={() => {setIsTrashDisplayed(false); setIsDownloadDisplayed(false)}}
    >
        <td>
            <span className={`${useCore ? 'icon-server' : 'icon-cloud'} mr-2`} />
            <div>
                <a className={`scanNameHash ${cleanClassName}`} href={scanUrl} target='_blank' rel='noreferrer'>{fileName}</a>
                <small className="d-block">{hash}</small>
            </div>
        </td>
        <td>{scanTime}</td>
        <td>
            <a href={scanUrl} className={cleanClassName}>{results}</a>
        </td>
        <td className="p-0">
            <span className={`${getStatusIcon(status)} ${cleanClassName}`} />
        </td>
        <td className="p-0">
            <a href="#" onClick={removeFile} title={chrome.i18n.getMessage('deleteTooltip')} className='trash'>
                <span className={trashClassName} />
            </a>
        </td>
        <td className="p-0">
            <a href="#" title={chrome.i18n.getMessage('downloadTooltip')} className='download-cloud'>
                <span className={downloadClassName} />
            </a>
        </td>
    </tr>;
};

ScanHistoryTableRow.propTypes = {
    fileName: PropTypes.string,
    scanUrl: PropTypes.string,
    hash: PropTypes.string,
    scanTime: PropTypes.string,
    results: PropTypes.string,
    removeFile: PropTypes.func,
    status: PropTypes.number,
    getStatusIcon: PropTypes.func,
    useCore: PropTypes.bool,
    useDLP: PropTypes.bool
};

export default ScanHistoryTableRow;