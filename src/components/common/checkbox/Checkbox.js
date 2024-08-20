import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { validateCoreSettings, validateCustomApikey } from '../../../providers/SettingsProvider';
import BrowserTranslate from '../../../services/common/browser/browser-translate';
import BackgroundTask from '../../../services/background/background-task';

import './Checkbox.scss';

const Checkbox = ({ label, isChecked, isDisabled, otherContent, hasForm, hasFormApikey, hasFormWhiteList, handleCheckboxChange, whiteListCustom, labelFor, getScanRules, coreApikey, apikeyCustom, coreUrl, coreRule, scanRules }) => {
    const checkboxRef = useRef(null);
    const inputRef = useRef(null);
    const [isInputChecked, setIsInputChecked] = useState(typeof isChecked === 'boolean' ? isChecked : false);
    const [apikey, setApikey] = useState();
    const [url, setUrl] = useState();
    const [rule, setCoreRule] = useState();
    const [error, setError] = useState({});
    const [customApikey, setCustomApikey] = useState();
    const backgroundTask = new BackgroundTask();
    const [whiteList, setWhiteList] = useState([]);

    const handleClick = async () => {
        if (!isDisabled) {
            setIsInputChecked(!isInputChecked);
            await handleCheckboxChange(labelFor);
        }
    };

    const saveCoreSettings = async () => {
        setError(null);
        const validCore = await validateCoreSettings(apikey, url);
        if (!validCore) {
            setError({ coreUrl: BrowserTranslate.getMessage('coreSettingsInvalidUrl') });
        }
        const coreSettings = {
            coreApikey: apikey,
            coreUrl: url,
            coreRule: rule,
        };

        await handleCheckboxChange('coreSettings', coreSettings);
    }

    const saveCustomSettings = async () => {
        setError(null);
        const validApikey = await validateCustomApikey(customApikey);

        if (!validApikey) {
            setError({ coreUrl: BrowserTranslate.getMessage('apikeyInvalidNotification') });
        }

        const customSettings = {
            apikeyCustom: customApikey,
        };

        await handleCheckboxChange('customSettings', customSettings);
        await backgroundTask.updateApikeyInfo(customApikey, true);
    };

    const saveCustomWhiteList = async () => {
        setError(null);
        inputRef.current.value = "";
        const whiteListCustomSettings = {
            whiteListCustom: whiteList || [],
        };
        await handleCheckboxChange('whiteListCustomSettings', whiteListCustomSettings);
    };

    const checkCoreSettings = async () => {
        getScanRules(apikey, url);
    }

    const handleApikeyChange = (e) => {
        setApikey(e.target.value);
    };

    const handleUrlChange = (e) => {
        setUrl(e.target.value);
    };

    const handleWorkflowChange = (e) => {
        setCoreRule(e.target.value);
    }

    const handleCustomApikeyChange = (e) => {
        setCustomApikey(e.target.value);
    };

    const handleWhiteList = (e) => {
        if (e.key === 'Enter') {
            const value = inputRef.current.value;
            if (value !== "") {
                setWhiteList(prevWhiteList => {
                    const updatedList = [...(prevWhiteList || []), value];
                    return updatedList;
                });
                inputRef.current.value = "";
            }
        }
    };

    const handleRemove = (index) => {
        setWhiteList(prevWhiteList => {
            if (!Array.isArray(prevWhiteList)) return [];
            const updatedList = [...prevWhiteList];
            updatedList.splice(index, 1);
            return updatedList;
        });
    };

    const formDomApikey = useMemo(() => {
        if (!hasFormApikey) {
            return;
        }

        return <fieldset className="form-with-inputs" disabled={!isInputChecked}>
            <Form.Group controlId="apiKey">
                <Form.Label className="col-md-2 col-sm-12 text-md-right text-left">Apikey</Form.Label>
                <Form.Control className="col-md-10 col-sm-12" type="text" placeholder="" value={customApikey || ''} onChange={handleCustomApikeyChange} />
            </Form.Group>

            <div className="col-md-12 d-flex justify-content-end p-0">
                <Button variant="primary" type="button" onClick={saveCustomSettings}>
                    {chrome.i18n.getMessage('coreSettingsSave')}
                </Button>
            </div>
        </fieldset>;
    }, [hasFormApikey, isInputChecked, customApikey]);

    const formDom = useMemo(() => {
        if (!hasForm) {
            return;
        }

        return <fieldset className="form-with-inputs" disabled={!isInputChecked}>
            <Form.Group controlId="apiKey">
                <Form.Label className="col-md-2 col-sm-12 text-md-right text-left">Apikey</Form.Label>
                <Form.Control className="col-md-10 col-sm-12" type="text" placeholder="" value={apikey || ''} onChange={handleApikeyChange} onBlur={checkCoreSettings} />
            </Form.Group>
            <Form.Group controlId="url" className={error?.coreUrl ? "m-0" : ""}>
                <Form.Label className="col-md-2 col-sm-12 text-md-right text-left">URL</Form.Label>
                <div className="col-md-10 col-sm-12 p-0">
                    <Form.Control className="w-100" type="text" placeholder="" value={url || ''} onChange={handleUrlChange} onBlur={checkCoreSettings} />

                </div>

            </Form.Group>
            <Form.Group>
                <span className='col-md-2 col-sm-12'></span>
                <p className='red col-md-10 col-sm-12 p-0'>{error?.coreUrl}</p>
            </Form.Group>
            <Form.Group controlId="workflow">
                <Form.Label className="col-sm-2 text-md-right text-left">Workflow</Form.Label>

                <Form.Control as="select" disabled={!scanRules?.length} value={rule} className="col-md-5" onChange={handleWorkflowChange}>
                    <option defaultValue=''>-- Default rule --</option>
                    {
                        scanRules?.map((rule) => <option key={rule} value={rule}>{rule}</option>)
                    }
                </Form.Control>

                <div className="col-md-5 p-0">
                    <Button variant="primary" type="button" onClick={saveCoreSettings}>
                        {chrome.i18n.getMessage('coreSettingsSave')}
                    </Button>
                </div>
            </Form.Group>
        </fieldset>;
    }, [hasForm, isInputChecked, apikey, url, rule, scanRules, error]);

    const formWhiteList = useMemo(() => {
        if (!hasFormWhiteList) {
            return null;
        }

        return (
            <fieldset className="form-with-inputs">
                <Form.Group controlId="whiteList">
                    <Form.Label className="col-md-2 col-sm-12 text-md-right text-left form-label">WhiteList</Form.Label>
                    <div className="col-md-10 col-sm-12 nopadding">
                        <div
                            className='whitelist-container'
                        >
                            <Form.Control
                                type="text"
                                placeholder=""
                                onKeyDown={handleWhiteList}
                                disabled={!isInputChecked}
                                ref={inputRef}
                            />

                            <div className="whitelist-badges">
                                {whiteList?.map((item, index) => {
                                    const uniqueKey = `${item}_${index}`;

                                    return (
                                        <div
                                            key={uniqueKey}
                                            className="badge badge-pill"
                                            style={{
                                                pointerEvents: !isInputChecked ? 'none' : 'auto',
                                                opacity: !isInputChecked ? 0.5 : 1
                                            }}
                                        >
                                            {item}
                                            <Button
                                                type='button'
                                                className="close-icon"
                                                onClick={() => handleRemove(index)}
                                                variant='close-icon'
                                            >
                                                &times;
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="col-md-12 p-0 mt-3">
                            <Button variant="primary" type="button" onClick={saveCustomWhiteList} disabled={!isInputChecked}>
                                {chrome.i18n.getMessage('coreSettingsSave')}
                            </Button>
                        </div>
                    </div>
                </Form.Group>
            </fieldset >
        );

    }, [isInputChecked, whiteList]);

    useEffect(() => {
        if (typeof isChecked === 'boolean') {
            setIsInputChecked(isChecked);
        }
        setApikey(coreApikey);
        setUrl(coreUrl);
        setCoreRule(coreRule);
        setCustomApikey(apikeyCustom);
        setWhiteList(whiteListCustom);
    }, [isChecked, coreApikey, coreUrl, coreRule, apikeyCustom, whiteListCustom]);

    return (
        <div className="form-group-wrapper">
            <Form.Group onClick={handleClick} className={`${isDisabled ? 'disabled' : ''}`}>
                <Form.Check type="checkbox" label={label} onChange={handleClick} checked={isInputChecked} disabled={isDisabled} ref={checkboxRef} />
            </Form.Group>
            <div className='other-content'>
                {otherContent}
            </div>
            {formDomApikey}
            {formDom}
            {formWhiteList}
        </div>

    );
};

Checkbox.propTypes = {
    label: PropTypes.node,
    isChecked: PropTypes.bool,
    isDisabled: PropTypes.bool,
    otherContent: PropTypes.node,
    hasForm: PropTypes.bool,
    hasFormApikey: PropTypes.bool,
    hasFormWhiteList: PropTypes.bool,
    handleCheckboxChange: PropTypes.func,
    labelFor: PropTypes.string,
    getScanRules: PropTypes.func,
    coreApikey: PropTypes.string,
    coreUrl: PropTypes.string,
    coreRule: PropTypes.string,
    apikeyCustom: PropTypes.string,
    whiteListCustom: PropTypes.array,
    scanRules: PropTypes.array
};

export default Checkbox;
