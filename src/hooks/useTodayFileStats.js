// computing the no of unknown, clean and infected files for today
import { useContext, useMemo } from 'react';
import { ScanHistoryContext } from '../providers/ScanHistoryProvider';
import { SCAN_STATUS } from '../services/constants/file';

const useTodayFileStats = () => {
    const { files } = useContext(ScanHistoryContext);

    const countFilesScannedToday = () => {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return files.filter(file => new Date(file.scanTime * 1000) >= startOfToday).length;
    }

    const countFilesBlockedToday = () => {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return files.filter(file => new Date(file.scanTime * 1000) >= startOfToday && file.status === SCAN_STATUS.VALUES.INFECTED).length;
    }

    const countFilesUnknownToday = () => {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return files.filter(file => new Date(file.scanTime * 1000) >= startOfToday && file.status === SCAN_STATUS.VALUES.UNKNOWN).length;
    }

    const filesScannedToday = useMemo(countFilesScannedToday, [files]);
    const filesBlockedToday = useMemo(countFilesBlockedToday, [files]);
    const filesUnknownToday = useMemo(countFilesUnknownToday, [files]);

    return { filesScannedToday, filesBlockedToday, filesUnknownToday };
};

export default useTodayFileStats;
