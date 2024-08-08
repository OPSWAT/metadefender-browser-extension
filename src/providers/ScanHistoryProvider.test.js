import React, { useContext } from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { ScanHistoryProvider, ScanHistoryContext } from './ScanHistoryProvider';
import ConfigContext from './ConfigProvider';
import { scanHistory } from '../services/common/persistent/scan-history';
import browserStorage from '../services/common/browser/browser-storage';

jest.mock('../services/common/persistent/scan-history', () => ({
    scanHistory: {
        init: jest.fn(),
        files: [],
        merge: jest.fn(),
        clear: jest.fn(),
        removeFile: jest.fn()
    }
}));

jest.mock('../services/common/browser/browser-storage', () => ({
    addListener: jest.fn(),
    removeListener: jest.fn()
}));

const mockConfig = {
    storageKey: {
        scanHistory: 'mockScanHistoryKey'
    }
};

describe('ScanHistoryProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes scan history and sets files', async () => {
        const mockFiles = [{ id: 1, name: 'file1' }];
        scanHistory.files = mockFiles;
        scanHistory.init.mockResolvedValueOnce();

        const TestComponent = () => {
            const { files } = useContext(ScanHistoryContext);
            return (
                <div>
                    {files.map(file => (
                        <span key={file.id} data-testid="file-name">{file.name}</span>
                    ))}
                </div>
            );
        };

        const { findByTestId } = render(
            <ConfigContext.Provider value={mockConfig}>
                <ScanHistoryProvider>
                    <TestComponent />
                </ScanHistoryProvider>
            </ConfigContext.Provider>
        );

        const fileNameElement = await findByTestId('file-name');
        expect(fileNameElement.textContent).toBe('file1');

        expect(scanHistory.init).toHaveBeenCalled();
        expect(scanHistory.files).toEqual(mockFiles);
    });

    it('clears scan history and updates files state', async () => {
        scanHistory.files = [{ id: 1, name: 'file1' }];
        scanHistory.clear.mockImplementation(() => {
            scanHistory.files = [];
        });

        const TestComponent = () => {
            const { files, clearnScanHistory } = useContext(ScanHistoryContext);
            return (
                <div>
                    {files.length === 0 ? (
                        <span data-testid="no-files">No Files</span>
                    ) : (
                        files.map(file => (
                            <span key={file.id} data-testid="file-name">{file.name}</span>
                        ))
                    )}
                    <button onClick={clearnScanHistory} data-testid="clear-button">Clear</button>
                </div>
            );
        };

        const { getByTestId } = render(
            <ConfigContext.Provider value={mockConfig}>
                <ScanHistoryProvider>
                    <TestComponent />
                </ScanHistoryProvider>
            </ConfigContext.Provider>
        );

        getByTestId('clear-button').click();

        await waitFor(() => {
            expect(getByTestId('no-files').textContent).toBe('No Files');
        });

        expect(scanHistory.clear).toHaveBeenCalled();
        expect(scanHistory.files).toEqual([]);
    });


    it('removes a file from scan history and updates files state', async () => {
        const mockFile = { id: 1, name: 'file1' };
        scanHistory.files = [mockFile];
        scanHistory.removeFile.mockImplementation((file) => {
            scanHistory.files = scanHistory.files.filter(f => f.id !== file.id);
        });

        const TestComponent = () => {
            const { files, removeScanHistoryFile } = useContext(ScanHistoryContext);
            return (
                <div>
                    {files.length === 0 ? (
                        <span data-testid="no-files">No Files</span>
                    ) : (
                        files.map(file => (
                            <span key={file.id} data-testid="file-name">{file.name}</span>
                        ))
                    )}
                    <button onClick={() => removeScanHistoryFile(mockFile)} data-testid="remove-button">Remove</button>
                </div>
            );
        };

        const { getByTestId } = render(
            <ConfigContext.Provider value={mockConfig}>
                <ScanHistoryProvider>
                    <TestComponent />
                </ScanHistoryProvider>
            </ConfigContext.Provider>
        );

        // Click the remove button and verify file is removed
        getByTestId('remove-button').click();

        await waitFor(() => {
            expect(getByTestId('no-files').textContent).toBe('No Files');
        });

        expect(scanHistory.removeFile).toHaveBeenCalledWith(mockFile);
        expect(scanHistory.files).toEqual([]);
    });

    it('updates scan history and files state when storage changes', async () => {
        const initialFiles = [{ id: 1, name: 'file1' }];
        scanHistory.files = initialFiles;

        const newFiles = [{ id: 2, name: 'file2' }];
        const changes = {
            [mockConfig.storageKey.scanHistory]: { newValue: newFiles }
        };

        scanHistory.merge.mockImplementation((newFiles) => {
            scanHistory.files = newFiles;
        });

        // Create a component that consumes the ScanHistoryContext
        const TestComponent = () => {
            const { files } = useContext(ScanHistoryContext);
            return (
                <div>
                    {files.length === 0 ? (
                        <span data-testid="no-files">No Files</span>
                    ) : (
                        files.map(file => (
                            <span key={file.id} data-testid="file-name">{file.name}</span>
                        ))
                    )}
                </div>
            );
        };

        render(
            <ConfigContext.Provider value={mockConfig}>
                <ScanHistoryProvider>
                    <TestComponent />
                </ScanHistoryProvider>
            </ConfigContext.Provider>
        );

        // Simulate a storage update
        act(() => {
            browserStorage.addListener.mock.calls[0][0](changes);
        });

        // Verify that merge was called with the new files
        expect(scanHistory.merge).toHaveBeenCalledWith(newFiles);
    });
});
