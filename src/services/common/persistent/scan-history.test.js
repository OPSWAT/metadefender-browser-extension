import { scanHistory } from './scan-history';
import BrowserStorage from '../../common/browser/browser-storage';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';

describe('scan-history', () => {
    const BrowserStorageGetSpy = jest.spyOn(BrowserStorage, 'get');
    const BrowserStorageSetSpy = jest.spyOn(BrowserStorage, 'set');

    const key = '/* @echo storageKey.scanHistory */';
    const mockData = {
        files: [
            { file: 'mock', status: 0, dataId: 0, id: 0 },
            { file: 'mock', status: 1, dataId: 1, id: 1 },
        ]
    };
    const newFile = { file: 'mock', status: 3, dataId: 3, id: 3 };

    it('should init with save', (done) => {
        BrowserStorageGetSpy.mockImplementationOnce(() => ({}));

        scanHistory.init();

        setTimeout(() => {
            expect(BrowserStorageGetSpy).toHaveBeenCalledWith(key);
            expect(BrowserStorageSetSpy).toHaveBeenCalledWith({ [key]: { files: [] } });

            done();
        }, 0);
    });

    it('should init with merge', (done) => {
        BrowserStorageGetSpy.mockImplementationOnce(() => ({ ...mockData }));

        scanHistory.init();

        setTimeout(() => {
            expect(BrowserStorageGetSpy).toHaveBeenCalledWith(key);
            expect(scanHistory.files).toEqual([]);
            done();
        }, 0);
    });

    it('should add a new file', (done) => {
        scanHistory.addFile(newFile);

        setTimeout(() => {
            expect(scanHistory.files).toHaveLength(1);
            done();
        }, 0);
    });

    it('should load data', (done) => {
        BrowserStorageGetSpy.mockImplementation(() => ({ files: [] }));

        scanHistory.load();

        setTimeout(() => {
            expect(BrowserStorageGetSpy).toHaveBeenCalledWith(key);

            done();
        }, 0);
    });

    it('should update file', (done) => {
        BrowserStorageGetSpy.mockImplementation(() => ({ ...mockData }));

        const dataIdToUpdate = 1;
        const { dataId, id, ...data } = newFile;
        scanHistory.updateFileByDataId(dataIdToUpdate, data);

        setTimeout(() => {
            expect(scanHistory.files.find(({ dataId }) => dataId === dataIdToUpdate)).toEqual(undefined);
            done();
        }, 0);
    });


    it('should update file by file id', (done) => {
        BrowserStorageGetSpy.mockImplementation(() => ({ ...mockData }));

        const dataIdToUpdate = 1;
        const { dataId, id, ...data } = newFile;
        scanHistory.updateFileById(dataIdToUpdate, data);

        setTimeout(() => {
            expect(scanHistory.files.find(({ dataId }) => dataId === dataIdToUpdate)).toEqual(undefined);
            done();
        }, 0);
    });


    it('should remove file by id', (done) => {
        scanHistory.removeFile(1);

        setTimeout(() => {
            expect(scanHistory.files).toHaveLength(1);
            done();
        }, 0);
    });

    it('should remove all files', (done) => {
        scanHistory.clear();

        setTimeout(() => {
            expect(scanHistory.files).toHaveLength(0);
            done();
        }, 0);
    });

    it('should remove pending all files', (done) => {
        scanHistory.cleanPendingFiles();

        setTimeout(() => {
            expect(scanHistory.files).toHaveLength(0);
            done();
        }, 0);
    });

    it('should clear all files', async () => {
        BrowserStorageGetSpy.mockResolvedValueOnce({ [key]: mockData });
        await scanHistory.load();

        await scanHistory.clear();

        expect(scanHistory.files).toHaveLength(0);
        expect(BrowserStorageSetSpy).toHaveBeenCalled();
    });

    it('should not save if no files were cleaned', async () => {
        const nonPendingFilesData = {
            files: [
                { file: 'file1', status: 1, dataId: 1, id: 1 },
                { file: 'file2', status: 2, dataId: 2, id: 2 }
            ]
        };
        BrowserStorageGetSpy.mockResolvedValueOnce({ [key]: nonPendingFilesData });
        await scanHistory.load();

        await scanHistory.cleanPendingFiles();

        expect(scanHistory.files).toHaveLength(2);
        expect(BrowserStorageSetSpy).not.toHaveBeenCalled();
    });



});
