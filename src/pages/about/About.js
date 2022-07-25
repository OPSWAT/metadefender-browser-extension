import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import openSettingsImg from '../../assets/images/how-to/open-settings.png';
import scanWithOpswatImg from '../../assets/images/how-to/right-click.png';
import SidebarLayout from '../../components/common/sidebar-layout/SidebarLayout';
import { useBackgroundContext } from '../../providers/Background';
import './About.scss';

const LABELS = {
    apikey: 'API Key',
    reputationLimit: 'Reputation API Limit',
    preventionLimit: 'Prevention API Limit',
    feedLimit: 'Feed API Limit',
    sandboxLimit: 'Sandbox API Limit',
    paidUser: 'Paid User',
    maxUploadFileSize: 'Maximum File Size',
};
const About = () => {
    const { gaTrackEvent, apikeyData } = useBackgroundContext();
    const [user, setUser] = useState({});

    useEffect(() => {
        gaTrackEvent(['_trackPageview', '/extension/about']);
    }, []);

    useEffect(() => {
        (async () => {
            if (!apikeyData) {
                return;
            }

            if (apikeyData.organization) {
                setUser({
                    apikey: apikeyData.apikey,
                    hasOrganization: true
                });
            } else {
                setUser({
                    apikey: apikeyData.apikey,
                    reputationLimit: apikeyData.reputationLimit,
                    preventionLimit: apikeyData.preventionLimit,
                    feedLimit: apikeyData.feedLimit,
                    sandboxLimit: apikeyData.sandboxLimit,
                    paidUser: apikeyData.paidUser,
                    maxUploadFileSize: apikeyData.maxUploadFileSize,
                });
            }
        })();
    }, [apikeyData]);

    const aboutOpswatFileSecurityDom = <>
        <h3>{chrome.i18n.getMessage('aboutTitle')}</h3>
        <p dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('aboutThankYou') }} />
        <p dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('githubInfo') }} />
        <p dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('chromeExtensionHelp') }} />
    </>;

    const yourMetadefenderApiKeyInfoDom = useMemo(() => <>
        <h4>{chrome.i18n.getMessage('aboutApiKeyInfo')}</h4>
        <ul className="file-information info-group label-150">
            {
                !user.apikey
                    ? <li><div className='spinner-border text-dark mb-4' role="status" /></li>
                    : Object.keys(user).map((item, key) => {
                        if (item === 'hasOrganization') {
                            return;
                        }

                        return <li key={key}>
                            <label>{LABELS[item]}</label>
                            <span>{user[item]}</span>
                        </li>;
                    })
            }
            {!user?.hasOrganization && <a href="https://www.opswat.com/contact" target="_blank" rel="noreferrer">{chrome.i18n.getMessage('contactOpswat')}</a>}
            {user?.hasOrganization && <p>Your limits are controlled by the organization. <br /><a href="https://id-staging.opswat.com/organization/overview" target="_blank" rel="noreferrer">View organization details</a></p>}
        </ul>

        <p dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('aboutMoreAboutMCL') }} />
    </>, [user]);

    const howToUseDom = <>
        <h4>{chrome.i18n.getMessage('aboutHowToUse')}</h4>

        <Row className="mt-4">
            <Col xs={12} sm={6}>
                <em>{chrome.i18n.getMessage('aboutHowTo1')}</em>
            </Col>
            <Col xs={12} sm={6} className="text-center text-xs-left">
                <img src={scanWithOpswatImg} className="img-fluid" alt="Scan with OPSWAT option" />
            </Col>
        </Row>

        <Row className="mt-4">
            <Col xs={{ span: 12, order: 1 }} sm={{ span: 6, order: 0 }} className="mt-xs-0 mt-4 text-center text-xs-left">
                <img src={openSettingsImg} className="img-fluid" alt="Open Extension Settings" />
            </Col>
            <Col xs={{ span: 12, order: 0 }} sm={{ span: 6, order: 1 }}>
                <em>{chrome.i18n.getMessage('howToOpenSettings')}</em>
            </Col>
        </Row>
    </>;

    const content = <>
        {aboutOpswatFileSecurityDom}
        {yourMetadefenderApiKeyInfoDom}
        {howToUseDom}
    </>;

    return <SidebarLayout
        className='about'
        content={content}
        currentPage='about'
    />;
};

About.prototype = {
    apikeyData: PropTypes.any
};

export default About;