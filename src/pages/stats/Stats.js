import React, { useContext, useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, PieController } from 'chart.js';
import SidebarLayout from '../../components/common/sidebar-layout/SidebarLayout';
import { ScanHistoryContext } from '../../providers/ScanHistoryProvider';
import { SCAN_STATUS } from '../../services/constants/file';

import "./Stats.scss"

// registering chart.js components
Chart.register(ArcElement, Tooltip, Legend, PieController);

const Stats = () => {
    const { files } = useContext(ScanHistoryContext);
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [{
            label: '',
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 1
        }]
    });

    useEffect(() => {
        const totalScans = files.length;
        const cleanCount = files.filter(file => file.status === SCAN_STATUS.VALUES.CLEAN).length;
        const infectedCount = files.filter(file => file.status === SCAN_STATUS.VALUES.INFECTED).length;
        const unknownCount = files.filter(file => file.status === SCAN_STATUS.VALUES.UNKNOWN).length;

        if (totalScans > 0) {
            setChartData({
                labels: ['Clean Files', 'Infected Files', 'Unknown Status'],
                datasets: [{
                    label: 'Scan Results',
                    data: [cleanCount, infectedCount, unknownCount],
                    backgroundColor: [
                       "#3D80FC", // for Clean Files
                        "rgba(232, 33, 35, 1)",  // for Infected Files
                        "rgba(255, 169, 50, 1)"   // for Unknown Status
                    ],
                    borderColor: [
                        "#3D80FC", // for Clean Files
                        "rgba(232, 33, 35, 1)",  // for Infected Files
                        "rgba(255, 169, 50, 1)"   // for Unknown Status
                    ],
                    borderWidth: 1,
                }]
            });
        }
    }, [files]);

    const content = (
        <div className="stats">
            <h2> File Scan Statistics</h2>
            <div className="chart-container">
                {chartData.datasets[0].data.length > 0 ? (
                    <Pie data={chartData} />
                ) : (
                    <p>No data available to display chart.</p>
                )}
            </div>
        </div>
    );

    return <SidebarLayout className='stats' currentPage='stats' content={content} />;
};

export default Stats;