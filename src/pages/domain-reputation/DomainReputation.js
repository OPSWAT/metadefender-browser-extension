import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, InputGroup, Row } from 'react-bootstrap';

import SidebarLayout from '../../components/common/sidebar-layout/SidebarLayout';
import ScanHistoryTable from '../../components/scan-history-table/ScanHistoryTable';
import ScanFile from '../../services/common/scan-file';

import ConfigContext from '../../providers/ConfigProvider';
import GAContext from '../../providers/GAProvider';
// import ScanHistoryContext from '../../providers/ScanHistoryProvider';

import './DomainReputation.scss';


const DomainReputation = () => {
    const content = 
    <Row>
        <Col className='mt-4 text-center font-weight-bold'>
            <span dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('noDomainsNotification') }} />
        </Col>
    </Row>
    
  return <SidebarLayout
        className='domain'
        currentPage='domain'
        content={content}
    />;
}

export default DomainReputation