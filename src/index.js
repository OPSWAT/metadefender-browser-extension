import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';

import reportWebVitals from './reportWebVitals';

import App from './App';
import { UserProvider } from './providers/UserProvider';

import './index.scss';
import { GAProvider } from './providers/GAProvider';
import { ConfigProvider } from './providers/ConfigProvider';

ReactDOM.render(
    <React.StrictMode>
        <ConfigProvider>
            <GAProvider>
                <UserProvider>
                    <HashRouter>
                        <App />
                    </HashRouter>
                </UserProvider>
            </GAProvider>
        </ConfigProvider>
    </React.StrictMode>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
