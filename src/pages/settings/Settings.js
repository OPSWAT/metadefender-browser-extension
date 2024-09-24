import React, { useContext, useEffect, useMemo } from 'react';
import { Form } from 'react-bootstrap';

import Checkbox from '../../components/common/checkbox/Checkbox';
import SidebarLayout from '../../components/common/sidebar-layout/SidebarLayout';

import SettingsContext from '../../providers/SettingsProvider';
import GAContext from '../../providers/GAProvider';
import UserContext from '../../providers/UserProvider';

import CheckboxData from './CheckboxData';

const Settings = () => {

    const { apikeyData } = useContext(UserContext);
    const { gaTrackEvent } = useContext(GAContext);
    const {
        settingsData,
        updateSettings,
        isAllowedFileSchemeAccess,
        getScanRules,
    } = useContext(SettingsContext);

    const handleCheckboxChange = async (labelFor, options = null) => {
        await updateSettings(labelFor, options);
    };

    useEffect(() => {
        (async () => {
            gaTrackEvent(['_trackPageview', '/extension/settings']);
        })();
    }, []);

    const checkboxDom = useMemo(() => {
        return CheckboxData(apikeyData?.paidUser, isAllowedFileSchemeAccess, settingsData?.isManaged).map((item) => <Checkbox
            key={item.labelFor}
            label={item.label}
            isDisabled={item?.isDisabled ?? false}
            isChecked={settingsData[item.labelFor]}
            handleCheckboxChange={handleCheckboxChange}
            description={item?.description ?? null}
            otherContent={item?.otherContent ?? null}
            labelFor={item.labelFor}
            hasForm={item?.hasForm ?? null}
            hasFormApikey={item?.hasFormApikey ?? null}
            hasFormWhiteList={item?.hasFormWhiteList ?? null}
            fileSizeLimit={(item.labelFor === 'skipLimit') ? settingsData.fileSizeLimit : null}
            coreApikey={(item.labelFor === 'useCore') ? settingsData.coreApikey : null}
            coreUrl={(item.labelFor === 'useCore') ? settingsData.coreUrl : null}
            coreRule={(item.labelFor === 'useCore') ? settingsData.coreRule : null}
            scanRules={(item.labelFor === 'useCore') ? settingsData.rules : null}
            apikeyCustom={(item.labelFor === 'useCustomApiKey') ? settingsData.apikeyCustom : null}
            whiteListCustom={(item.labelFor === 'useWhiteList') ? settingsData.whiteListCustom : null}
            getScanRules={getScanRules}
            isManaged={settingsData?.isManaged}
        />);
    }, [settingsData, apikeyData, isAllowedFileSchemeAccess]);

    const content = <Form>
        {checkboxDom}
    </Form>;

    return <SidebarLayout
        className='settings'
        currentPage='settings'
        content={content}
    />;
};

export default Settings;
