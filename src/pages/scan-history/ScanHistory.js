import React, { useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, InputGroup, Row } from 'react-bootstrap';
import SidebarLayout from '../../components/common/sidebar-layout/SidebarLayout';
import ScanHistoryTable from '../../components/scan-history-table/ScanHistoryTable';
import { useBackgroundContext } from '../../providers/Background';
import browserStorage from '../../services/common/browser/browser-storage';
import { scanHistory } from '../../services/common/persistent/scan-history';
import ScanFile from '../../services/common/scan-file';
import './ScanHistory.scss';

const ScanHistory = () => {
    const { gaTrackEvent, MCL } = useBackgroundContext();
    const [searchValue, setSearchValue] = useState('');
    const [files, setFiles] = useState([]);
    const totalScannedFiles = files.length;
    const scanUrl = MCL.config.mclDomain;

    useEffect(() => {
        gaTrackEvent(['_trackPageview', '/extension/history']);

        (async () => {
            const data = await scanHistory.load();
            setFiles(data.scanHistory?.files || []);
        })();

        browserStorage.addListener(messageListener);

        return () => {
            browserStorage.removeListener(messageListener);
        };
    }, []);


    const messageListener = (changes) => {
        if (Object.keys(changes).includes('scanHistory')) {
            setFiles(changes.scanHistory.newValue.files);
        }
    };

    /** Delete all existing history */
    const clearScanHistory = async () => {
        if (confirm(chrome.i18n.getMessage('deleteHistoryConfirmation'))) {
            gaTrackEvent(['_trackEvent', MCL.config.gaEventCategory.name, MCL.config.gaEventCategory.action.buttonClickd, MCL.config.gaEventCategory.label.clearHistoryButton, MCL.config.gaEventCategory.value.clearHistoryButton]);
            await scanHistory.clear();
        }
    };

    /** Delete a file from the history */
    const removeFile = async (event, file) => {
        event.preventDefault();
        gaTrackEvent(['_trackEvent', MCL.config.gaEventCategory.name, MCL.config.gaEventCategory.action.buttonClickd, MCL.config.gaEventCategory.label.clearHistoryButton, MCL.config.gaEventCategory.value.deleteItemButton]);
        await scanHistory.removeFile(file);
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

    const getScanUrl = (file) => {
        if (file.dataId) {
            return `${scanUrl}/results/file/${file.dataId}/regular/overview`;
        }

        return `${scanUrl}/results/file/${file.md5}/hash/overview`;
    };

    const scanHistoryTableData = files.map((item) => ({
        fileName: item.fileName,
        scanUrl: item.scanResults || getScanUrl(item),
        hash: item.sha256,
        scanTime: item.scanTime,
        results: item.statusLabel,
        status: item.status,
        id: item.id, 
        useCore: item?.useCore
    }));

    const handleSearch = (e) => setSearchValue(e.target?.value);

    const filesPlacehoder = useMemo(() => totalScannedFiles !== 1 ? 'files' : 'file', [totalScannedFiles]);

    const content = totalScannedFiles === 0
        ? <Row>
            <Col className='mt-4 text-center font-weight-bold'>
                <span dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('noScansNotification') }} />
            </Col>
        </Row>
        : <React.Fragment>
            <Row>
                <Col sm={6} xs={12}>
                    <InputGroup className="mb-4 history--search__input">
                        <Form.Control
                            placeholder="Search history"
                            aria-label="Search history"
                            onChange={handleSearch}
                        />
                        <InputGroup.Append>
                            <Button variant="outline-primary" disabled>
                                <span className="icon-search"></span>
                            </Button>
                        </InputGroup.Append>
                    </InputGroup>
                </Col>
            </Row>

            <Row className="align-items-center history--scan__info">
                <Col xs={6}>
                    <strong className="history--scanned__files">{`${totalScannedFiles} ${filesPlacehoder} scanned`}</strong>
                </Col>
                <Col xs={6} className="text-right">
                    <Button variant="outline-primary" className="small" onClick={() => (async() => await clearScanHistory())()}>Clear Scan History</Button>
                </Col>
            </Row>

            <ScanHistoryTable data={scanHistoryTableData} filterBy={searchValue} removeFile={removeFile} getStatusIcon={getStatusIcon} />
        </React.Fragment>;

    return <SidebarLayout
        className='history'
        content={content}
        currentPage='history'
    />;
};

export default ScanHistory;