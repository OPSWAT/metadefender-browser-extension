import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'react-bootstrap';
import Checkbox from '../../components/common/checkbox/Checkbox';
import SidebarLayout from '../../components/common/sidebar-layout/SidebarLayout';
import config from '../../config/common.json';
import useSettingsChange from '../../hooks/useSettingsChange';
import { useBackgroundContext } from '../../providers/Background';
import BrowserExtension from '../../services/common/browser/browser-extension';
import CoreClient from '../../services/common/core-client';
import { apikeyInfo } from '../../services/common/persistent/apikey-info';
import { settings } from '../../services/common/persistent/settings';
import CheckboxData from './CheckboxData';

const Settings = () => {
    const { gaTrackEvent, apikeyData } = useBackgroundContext();
    const { currentSettings, coreSettings, onSettingsChanged, setCoreSettings, validateCoreSettings } = useSettingsChange();
    const [isAllowedFileSchemeAccess, setIsAllowedFileSchemeAccess] = useState(null);

    /** Load the current settings, push Google Analytics */
    const activate = async () => {
        gaTrackEvent(['_trackPageview', '/extension/settings']);
        await apikeyInfo.init();
        // await settings.init();

        const isAllowedFileSchemeAccess = await BrowserExtension.isAllowedFileSchemeAccess();
        setIsAllowedFileSchemeAccess(isAllowedFileSchemeAccess);

        if (!isAllowedFileSchemeAccess) {
            await onSettingsChanged('scanDownloads');
        }

        if (coreSettings.useCore) {
            validateCoreSettings();
        }

        initDropdowns();
    };

    const initDropdowns = () => {
        setCoreSettings({
            ...coreSettings,
            rule: {
                value: settings.coreRule || coreSettings.scanRules[0]
            }
        });
    };

    const handleCheckboxChange = async (labelFor, options = null) => {
        await onSettingsChanged(labelFor, options);
    };

    useEffect(() => {
        CoreClient.configure({
            pollingIncrementor: config.scanResults.incrementor,
            pollingMaxInterval: config.scanResults.maxInterval
        });

        (async () => {
            await activate();
        })();
    }, []);

    const checkboxDom = useMemo(() => {
        if (!currentSettings) {
            return;
        }

        const isPaidUser = apikeyData?.paidUser;
        
        return CheckboxData(isPaidUser, isAllowedFileSchemeAccess).map((item, key) => <Checkbox
            key={key}
            label={item.label}
            isDisabled={item?.isDisabled ?? false}
            isChecked={currentSettings[item.labelFor]}
            handleCheckboxChange={handleCheckboxChange}
            description={item?.description ?? null}
            otherContent={item?.otherContent ?? null}
            hasForm={item?.hasForm ?? null}
            labelFor={item.labelFor}
            coreApikey={currentSettings.coreApikey}
            coreUrl={currentSettings.coreUrl}
            coreV4={currentSettings.coreV4}
        />);
    }, [currentSettings, apikeyData, isAllowedFileSchemeAccess]);

    const content = <Form>
        {checkboxDom}
    </Form>;

    return <SidebarLayout
        className='settings'
        content={content}
        currentPage='settings'
    />;
};

export default Settings;
