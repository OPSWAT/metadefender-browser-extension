import React from 'react';
import { mount } from 'enzyme';
import BackgroundContext from '../../providers/Background';
import About from './About';

describe('About', () => {
    const userApikeyData = {
        apikey: 'apikey',
        reputationLimit: 'reputationLimit',
        preventionLimit: 'preventionLimit',
        feedLimit: 'feedLimit',
        sandboxLimit: 'sandboxLimit',
        paidUser: 'paidUser',
        maxUploadFileSize: 'maxUploadFileSize',
    };

    const organizationApikeyData = {
        apikey: 'apikey',
        organization: true,
    };

    it('should render user apikey info', () => {
        const AboutWrapper = mount(
            <BackgroundContext.Provider
                value={{
                    gaTrackEvent: () => null,
                    apikeyData: userApikeyData
                }}
            >
                <About />
            </BackgroundContext.Provider>
        );

        expect(AboutWrapper.find('.file-information.info-group li')).toHaveLength(Object.keys(userApikeyData).length);
    });

    it('should render organization apikey info', () => {
        const AboutWrapper = mount(
            <BackgroundContext.Provider
                value={{
                    gaTrackEvent: () => null,
                    apikeyData: organizationApikeyData
                }}
            >
                <About />
            </BackgroundContext.Provider>
        );

        expect(AboutWrapper.find('.file-information.info-group li')).toHaveLength(1);
    });


});