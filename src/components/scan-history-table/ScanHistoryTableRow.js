import React, { useState } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

const ScanHistoryTableRow = ({ fileName, scanUrl, hash, scanTime, results, removeFile, status, getStatusIcon }) => {
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
            <span className="icon-cloud mr-2" />
            <div>
                <a className={cleanClassName} href={scanUrl} target='_blank' rel='noreferrer'>{fileName}</a>
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
    getStatusIcon: PropTypes.func
};

export default ScanHistoryTableRow;