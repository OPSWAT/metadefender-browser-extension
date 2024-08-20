import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Popup from './Popup';
import { ConfigContext } from '../../providers/ConfigProvider';
import { GAContext } from '../../providers/GAProvider';
import { ScanHistoryContext } from '../../providers/ScanHistoryProvider';


jest.mock('../../services/common/scan-file', () => ({
  STATUS: {
    CLEAN: 0,
    INFECTED: 1,
    SCANNING: 2,
  }
}));

jest.mock('../../services/background/navigation', () => ({
  goToTab: jest.fn(),
}));

describe('Popup Component', () => {
  let mockConfig, mockGaContext, mockScanHistoryContext;

  // Mock the context values
  mockConfig = {
    mclDomain: 'https://scan.example.com',
    gaEventCategory: {
      name: 'category',
      action: {
        linkClicked: 'linkClicked',
      },
      label: {
        scanHistory: 'scanHistoryLabel',
      },
    },
  };

  mockGaContext = {
    gaTrackEvent: jest.fn(),
  };



  beforeEach(() => {


  });

  test('should display file names from scan history', () => {
    mockScanHistoryContext = {
      files: [
        {
          fileName: 'testFile1',
          status: 0,
          dataId: '123',
          scanResults: 'https://scan.example.com/results/file/123/regular/peinfo',
        },
      ],
    };

    render(
      <ConfigContext.Provider value={mockConfig}>
        <GAContext.Provider value={mockGaContext}>
          <ScanHistoryContext.Provider value={mockScanHistoryContext}>
            <Popup />
          </ScanHistoryContext.Provider>
        </GAContext.Provider>
      </ConfigContext.Provider>
    );
    expect(screen.getByText('testFile1')).toBeInTheDocument();
  });

  test('should display "View Scan History" link', () => {
    mockScanHistoryContext = {
      files: [
        {
          fileName: 'testFile1',
          status: 1,
          dataId: '123',
          scanResults: 'https://scan.example.com/results/file/123/regular/peinfo',
        },
      ],
    };

    render(
      <ConfigContext.Provider value={mockConfig}>
        <GAContext.Provider value={mockGaContext}>
          <ScanHistoryContext.Provider value={mockScanHistoryContext}>
            <Popup />
          </ScanHistoryContext.Provider>
        </GAContext.Provider>
      </ConfigContext.Provider>
    );
    expect(screen.getByText('View Scan History')).toBeInTheDocument();
    expect(screen.getByTestId('icon-cancel')).toBeInTheDocument();
  });

  test('should display "View Scan History" link when file is loading', () => {
    mockScanHistoryContext = {
      files: [
        {
          fileName: 'testFile1',
          status: 2,
          dataId: '123',
          scanResults: 'https://scan.example.com/results/file/123/regular/peinfo',
        },
      ],
    };

    render(
      <ConfigContext.Provider value={mockConfig}>
        <GAContext.Provider value={mockGaContext}>
          <ScanHistoryContext.Provider value={mockScanHistoryContext}>
            <Popup />
          </ScanHistoryContext.Provider>
        </GAContext.Provider>
      </ConfigContext.Provider>
    );

    expect(screen.getByTestId('icon-spin animate-spin')).toBeInTheDocument();
  });

  test('should display help icon', () => {
    mockScanHistoryContext = {
      files: [
        {
          fileName: 'testFile1',
          status: null,
          dataId: '123',
          scanResults: 'https://scan.example.com/results/file/123/regular/peinfo',
        },
      ],
    };

    render(
      <ConfigContext.Provider value={mockConfig}>
        <GAContext.Provider value={mockGaContext}>
          <ScanHistoryContext.Provider value={mockScanHistoryContext}>
            <Popup />
          </ScanHistoryContext.Provider>
        </GAContext.Provider>
      </ConfigContext.Provider>
    );

    expect(screen.getByTestId('icon-help')).toBeInTheDocument();
  });

  test('renders "no scans" message when there are no files', () => {
    render(
      <ConfigContext.Provider value={mockConfig}>
        <GAContext.Provider value={mockGaContext}>
          <ScanHistoryContext.Provider value={{ files: [] }}>
            <Popup />
          </ScanHistoryContext.Provider>
        </GAContext.Provider>
      </ConfigContext.Provider>
    );

    expect(screen.getByText('View Scan History')).toBeInTheDocument();
  });

});
