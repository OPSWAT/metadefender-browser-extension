import { shallow } from 'enzyme';
import React from 'react';
import ScanHistoryTableRow from './ScanHistoryTableRow';


describe('ScanHistoryTableRow', () => {
    const removeFile = jest.fn();
    const getStatusIcon = () => 'status-icon';

    const props = {
        fileName: 'fileName',
        scanUrl: 'scanUrl',
        hash: 'hash',
        scanTime: 'scanTime',
        results: 'results',
        status: 0,
        removeFile,
        getStatusIcon,
    };

    it('should render a row', () => {
        const rowWrapper = shallow(<ScanHistoryTableRow {...props} />);

        expect(rowWrapper.find('.status-icon')).toHaveLength(1);
    });

    it('should handle mouse enter and leave', () => {
        const rowWrapper = shallow(<ScanHistoryTableRow {...props} />);

        expect(rowWrapper.find('.invisible')).toHaveLength(1);

        rowWrapper.find('tr').simulate('mouseenter');

        expect(rowWrapper.find('.invisible')).toHaveLength(0);

        rowWrapper.find('tr').simulate('mouseleave');
        expect(rowWrapper.find('.invisible')).toHaveLength(1);
    });
});