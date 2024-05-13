import React, { useMemo } from 'react';
import { Table } from 'react-bootstrap';
import moment from 'moment';
import ScanHistoryTableRow from './ScanHistoryTableRow';
import PropTypes from 'prop-types';

import './ScanHistoryTable.scss';

const ScanHistoryTable = ({ data, filterBy, removeFile, getStatusIcon }) => {
    const processedData = useMemo(() => {
        if (!filterBy) {
            return data;
        }

        return data.filter((item) => {
            return item.fileName.includes(filterBy);
        });
    }, [data, filterBy]);
    const tableDom = useMemo(() => {
        if (!processedData?.length) {
            return <p className="mt-5 text-center" dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('noFilesFound') }} />;
        }

        return <Table bordered className="mt-4">
            <thead>
                <tr>
                    <th>Filename</th>
                    <th>Scan Time</th>
                    <th colSpan={3}>Results</th>
                    <th>DLP</th>
                </tr>
            </thead>

            <tbody>
                {processedData.map((item, key) => (
                   <ScanHistoryTableRow
                        key={key}
                        fileName={item.fileName}
                        scanUrl={item.scanUrl}
                        hash={item.hash}
                        scanTime={moment.unix(item.scanTime).fromNow()}
                        results={item.results}
                        status={item.status}
                        removeFile={(event) => removeFile(event, item.id)}
                        getStatusIcon={getStatusIcon}
                        useCore={item.useCore}
                        useDLP={item.useDLP}
                    />
                ))}
            </tbody>
        </Table>;
    }, [processedData]);


    return <>
        {tableDom}
    </>;
};

ScanHistoryTable.propTypes = {
    data: PropTypes.array,
    filterBy: PropTypes.string,
    removeFile: PropTypes.func,
    getStatusIcon: PropTypes.func
};

export default ScanHistoryTable;