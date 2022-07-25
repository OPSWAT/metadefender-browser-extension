import { shallow } from 'enzyme';
import React from 'react';
import { Table } from 'react-bootstrap';
import ScanHistoryTable from './ScanHistoryTable';
import ScanHistoryTableRow from './ScanHistoryTableRow';

describe('ScanHistoryTable', () => {
    const mockData = [
        { fileName: 'file_0' },
        { fileName: 'file_1' },
        { fileName: 'mock_2' },
        { fileName: 'mock_3' },
    ];

    it('should render all data', () => {
        const ScanHistoryTableWrapper = shallow(<ScanHistoryTable data={mockData} />);

        expect(ScanHistoryTableWrapper.find(ScanHistoryTableRow)).toHaveLength(4);
    });

    it('should render filtered data', () => {
        const ScanHistoryTableWrapper = shallow(<ScanHistoryTable data={mockData} filterBy='mock' />);

        expect(ScanHistoryTableWrapper.find(ScanHistoryTableRow)).toHaveLength(2);
    });

    it('should render no file found', () => {
        const ScanHistoryTableWrapper = shallow(<ScanHistoryTable data={[]} />);

        expect(ScanHistoryTableWrapper.find(Table)).toHaveLength(0);
        expect(ScanHistoryTableWrapper.find('.mt-5.text-center')).toHaveLength(1);
    });
});