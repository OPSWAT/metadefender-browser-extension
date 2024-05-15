import React, { useContext, useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import SidebarLayout from '../../components/common/sidebar-layout/SidebarLayout';
import { ScanHistoryContext } from '../../providers/ScanHistoryProvider';
import { SCAN_STATUS } from '../../services/constants/file';

import useTodayFileStats from '../../hooks/useTodayFileStats';

import "./Stats.scss"
import "../../assets/style/colors.scss"

// register chart.js components
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Stats = () => {
    const { files } = useContext(ScanHistoryContext);
    const { filesScannedToday, filesBlockedToday, filesUnknownToday } = useTodayFileStats();

    // legend
    const initialDatasets = [
        { label: 'Clean Files', backgroundColor: '#154FBA', borderColor: '#154FBA', borderWidth: 1 },
        { label: 'Infected Files', backgroundColor: '#a94442', borderColor: '#a94442', borderWidth: 1 },
        { label: 'Unknown Files', backgroundColor: '#5e6e6f', borderColor: '#5e6e6f', borderWidth: 1 }
    ];
    
    const [chartData, setChartData] = useState({
        labels: ['All Time Scan Data'],
        datasets: initialDatasets
    });
    
    const [todayChartData, setTodayChartData] = useState({
        labels: ['Today\'s Scan Data'],
        datasets: initialDatasets
    });
    

    useEffect(() => {
        const cleanCount = files.filter(file => file.status === SCAN_STATUS.VALUES.CLEAN).length;
        const infectedCount = files.filter(file => file.status === SCAN_STATUS.VALUES.INFECTED).length;
        const unknownCount = files.filter(file => file.status === SCAN_STATUS.VALUES.UNKNOWN).length;

        setChartData(prev => ({
            ...prev,
            datasets: [
                {...prev.datasets[0], data: [cleanCount]},
                {...prev.datasets[1], data: [infectedCount]},
                {...prev.datasets[2], data: [unknownCount]}
            ]
        }));
    }, [files]);

    useEffect(() => {
        setTodayChartData(prev => ({
            ...prev,
            datasets: [
                {...prev.datasets[0], data: [filesScannedToday - filesBlockedToday - filesUnknownToday]},
                {...prev.datasets[1], data: [filesBlockedToday]},
                {...prev.datasets[2], data: [filesUnknownToday]}
            ]
        }));
    }, [filesScannedToday, filesBlockedToday, filesUnknownToday]);

    const noDataAvailable = files.length === 0;
    const noTodayData = filesScannedToday === 0;

    // common chart options
    // showing legend depending on which type of scan history data we have
    const getChartOptions = (showLegend) => ({
        indexAxis: 'x',
        plugins: {
            legend: {
                display: showLegend,
                position: 'top'
            }
        }
    });

    const content = (
        <div className="stats">
            <h2>File Scan Statistics</h2>
            <div className="chart-container">
                {noDataAvailable ? (
                    <p>No scan data available. Start scanning files to see stats here.</p>
                ) : (
                    <>
                    <div className='chart1'>
                        {noTodayData ? (
                            <p>No scan data available for today yet.</p>
                        ) : (
                            <>
                                <h3>Today's Data</h3>
                                <Bar data={todayChartData} options={getChartOptions(true)} />
                            </>
                        )}
                    </div>
                    <div className='chart2'>
                        <h3>All Time Data</h3>
                        <Bar data={chartData} options={getChartOptions(noTodayData)} />
                    </div>
                    </>
                )}
            </div>
        </div>
    );

    return <SidebarLayout className='stats' currentPage='stats' content={content} />;
};

export default Stats;
