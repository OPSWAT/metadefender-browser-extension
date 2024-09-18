import React, { useState } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

const ScanHistoryTableRow = ({ fileName, scanUrl, hash, scanTime, results, removeFile, status, getStatusIcon, useCore }) => {
    const [isTrashDisplayed, setIsTrashDisplayed] = useState(false);
    const trashClassName = classNames({
        'invisible': !isTrashDisplayed
    }, 'mcl-icon icon-trash');

    const cleanClassName = classNames({
        'noThreatsFound': results === 'No threats found'
    });

    return <tr
        onMouseEnter={() => setIsTrashDisplayed(true)}
        onMouseLeave={() => setIsTrashDisplayed(false)}
    >
        <td>
            <span className={`${useCore ? 'icon-server' : 'icon-cloud'} mr-2`} />
            <div>
                {scanUrl ? <a className={`scanNameHash ${cleanClassName}`} href={scanUrl} target='_blank' rel='noreferrer'>{fileName}</a> : <div className={`scanNameHash ${cleanClassName}`}>{fileName}</div>}
                <small className="d-block">{hash}</small>
            </div>
        </td>
        <td>{scanTime}</td>
        <td>
            {scanUrl ? <a className={cleanClassName} href={scanUrl} target='_blank' rel='noreferrer'>{results}</a> : <div className={cleanClassName}>{results}</div>}
        </td>
        <td className="p-0">
            <span className={`${getStatusIcon(status)} ${cleanClassName}`} />
        </td>
        <td className="p-0">
            <button onClick={removeFile} title={chrome.i18n.getMessage('deleteTooltip')} className='trash'>
                <span className={trashClassName} />
            </button>
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
    useCore: PropTypes.bool
};

export default ScanHistoryTableRow;