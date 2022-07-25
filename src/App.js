import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import './App.scss';
import Popup from './components/popup/Popup';
import About from './pages/about/About';
import ScanHistory from './pages/scan-history/ScanHistory';
import Settings from './pages/settings/Settings';

/**
 * Returns a Switch with defined routes for each component/page. 
 * Popup is the default location, while the others are for the settings page
 */
const App = () => <>
    <Switch>
        <Route path="/settings">
            <Settings />
        </Route>
        <Route path="/about">
            <About />
        </Route>
        <Route path="/history">
            <ScanHistory />
        </Route>
        <Route path="/">
            <Popup />
        </Route>
    </Switch>
</>;

export default App;
