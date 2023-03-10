import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { validateCoreSettings } from '../../../providers/SettingsProvider';
import BrowserTranslate from '../../../services/common/browser/browser-translate';


import './Checkbox.scss';

const Checkbox = ({ label, isChecked, isDisabled, otherContent, hasForm, handleCheckboxChange, labelFor, getScanRules, coreApikey, coreUrl, coreRule, scanRules }) => {
    const checkboxRef = useRef(null);
    const [isInputChecked, setIsInputChecked] = useState(typeof isChecked === 'boolean' ? isChecked : false);
    const [apikey, setApikey] = useState();
    const [url, setUrl] = useState();
    const [rule, setCoreRule] = useState();
    const [error, setError] = useState({});

    const handleClick = async () => {
        if (!isDisabled) {
            setIsInputChecked(!isInputChecked);
            await handleCheckboxChange(labelFor);
        }
    };

    const saveCoreSettings = async () => {
        setError(null);
        const validCore = await validateCoreSettings(apikey, url);
        if(!validCore)
        {
            setError({coreUrl: BrowserTranslate.getMessage('coreSettingsInvalidUrl')});
        }
        const coreSettings = {
            coreApikey: apikey,
            coreUrl: url,
            coreRule: rule,
        };
    
        await handleCheckboxChange('coreSettings', coreSettings);
    }

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

    const formDom = useMemo(() => {
        if (!hasForm) {
            return;
        }

        return <fieldset className="form-with-inputs" disabled={!isInputChecked}>
            <Form.Group controlId="apiKey">
                <Form.Label className="col-md-2 col-sm-12 text-md-right text-left">Apikey</Form.Label>
                <Form.Control className="col-md-10 col-sm-12" type="text" placeholder="" value={apikey || ''} onChange={handleApikeyChange} onBlur={checkCoreSettings}/>
            </Form.Group>
            <Form.Group controlId="url" className={error?.coreUrl?"m-0":""}>
                <Form.Label className="col-md-2 col-sm-12 text-md-right text-left">URL</Form.Label>
                <div className="col-md-10 col-sm-12 p-0">
                    <Form.Control className="w-100" type="text" placeholder="" value={url || ''} onChange={handleUrlChange} onBlur={checkCoreSettings}/>
                    
                </div>
                
            </Form.Group>
            <Form.Group>
                <span className='col-md-2 col-sm-12'></span>  
                <p className='red col-md-10 col-sm-12 p-0'>{error?.coreUrl}</p>
            </Form.Group>         
            <Form.Group controlId="workflow">
                <Form.Label className="col-sm-2 text-md-right text-left">Workflow</Form.Label>

                <Form.Control as="select" disabled={!scanRules.length} value={rule} className="col-md-5" onChange={handleWorkflowChange}>
                    <option defaultValue=''>-- Default rule --</option>
                    {
                        scanRules.map((rule) => <option key={rule} value={rule}>{rule}</option>)
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

    useEffect(() => {
        if (typeof isChecked === 'boolean') {
            setIsInputChecked(isChecked);
        }
        setApikey(coreApikey);
        setUrl(coreUrl);
        setCoreRule(coreRule);
    }, [isChecked, coreApikey, coreUrl, coreRule]);

    return (
        <div className="form-group-wrapper">
            <Form.Group onClick={handleClick} className={`${isDisabled ? 'disabled' : ''}`}>
                <Form.Check type="checkbox" label={label} onChange={handleClick} checked={isInputChecked} disabled={isDisabled} ref={checkboxRef} />
            </Form.Group>
            <div className='other-content'>
                {otherContent}
            </div>
            {formDom}
        </div>
    );
};

Checkbox.propTypes = {
    label: PropTypes.node,
    isChecked: PropTypes.bool,
    isDisabled: PropTypes.bool,
    otherContent: PropTypes.node,
    hasForm: PropTypes.bool,
    handleCheckboxChange: PropTypes.func,
    validateCoreSettings: PropTypes.func,
    labelFor: PropTypes.string,
    getScanRules: PropTypes.func,
    coreApikey: PropTypes.string,
    coreUrl: PropTypes.string,
    coreRule: PropTypes.string,
    coreRules: PropTypes.array,
};

export default Checkbox;
