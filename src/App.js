import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Popup from './components/popup/Popup';
import About from './pages/about/About';
import ScanHistory from './pages/scan-history/ScanHistory';
import Settings from './pages/settings/Settings';
import { useLocation } from 'react-router-dom';

import './App.scss';

/**
 * Returns a Switch with defined routes for each component/page. 
 * Popup is the default location, while the others are for the settings page
 */
function App () {    
    return (
        <Routes>
            <Route 
                path='/settings'
                element={<Settings />}
            />
            <Route 
                path='/about'
                element={<About />}
            />
            <Route 
                path='/history'
                element={<ScanHistory />}
            />
            <Route 
                path='/'
                element={<Popup />}
            />
        </Routes>
    );
};

export default App;
