import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import PropTypes from 'prop-types';

import './Checkbox.scss';

const Checkbox = ({ label, isChecked, isDisabled, otherContent, hasForm, handleCheckboxChange, labelFor, coreApikey, coreUrl, coreV4 }) => {
    const checkboxRef = useRef(null);
    const [isInputChecked, setIsInputChecked] = useState(typeof isChecked === 'boolean' ? isChecked : false);
    const [apikey, setApikey] = useState(coreApikey);
    const [url, setUrl] = useState(coreUrl);
    const [isCoreV4, setIsCoreV4] = useState(false);
    useEffect(() => {
        setApikey(coreApikey);
    }, [coreApikey]);

    useEffect(() => {
        setUrl(coreUrl);
    }, [coreUrl]);

    useEffect(() => {
        setIsCoreV4(coreV4);
    }, [coreV4]);



    useEffect(() => {
        if (typeof isChecked === 'boolean') {
            setIsInputChecked(isChecked);
        }
    }, [isChecked]);

    const handleClick = async (isCoreSettings) => {
        if (isCoreSettings) {
            const coreSettings = {
                apikey,
                url,
                useCore: isInputChecked,
                isCoreV4:isCoreV4
            };

            await handleCheckboxChange(isCoreSettings, coreSettings);
            return;
        }

        if (!isDisabled) {
            setIsInputChecked(!isInputChecked);
            await handleCheckboxChange(labelFor);
        }
    };

    const handleApikeyChange = (e) => {
        setApikey(e.target.value);
    };

    const handleUrlChange = (e) => {
        setUrl(e.target.value);
    };

    const handleCoreV4Change = () => {
        setIsCoreV4(!isCoreV4);
    };

    const formDom = useMemo(() => {
        if (!hasForm) {
            return;
        }

        return <fieldset className="form-with-inputs" disabled={isInputChecked ? false : true}>
            <Form.Group controlId="apiKey">
                <Form.Label className="col-md-2 col-sm-12 text-md-right text-left">Apikey</Form.Label>
                <Form.Control className="col-md-10 col-sm-12" type="text" placeholder="" value={apikey || ''} onChange={handleApikeyChange} />
            </Form.Group>
            <Form.Group controlId="url">
                <Form.Label className="col-md-2 col-sm-12 text-md-right text-left">URL</Form.Label>
                <Form.Control className="col-md-10 col-sm-12" type="text" placeholder="" value={url || ''} onChange={handleUrlChange} />
            </Form.Group>
            <Form.Group onClick={() => handleCoreV4Change()} className="coreV4" controlId="coreV4">
                <Form.Label className="col-md-2 col-sm-12 text-md-right text-left">CoreV4</Form.Label>
                <Form.Control type="checkbox" checked={isCoreV4} onChange={() => handleCoreV4Change()} />
            </Form.Group>
            <Form.Group controlId="workflow">
                <Form.Label className="col-sm-2 text-md-right text-left">Workflow</Form.Label>

                <Form.Control as="select" disabled className="col-md-5">
                    <option defaultValue>-- Default rule --</option>
                </Form.Control>

                <div className="col-md-5 p-0">
                    <Button variant="primary" type="button" disabled={apikey === '' && url === ''} onClick={() => handleClick('coreSettings')}>
                        {chrome.i18n.getMessage('coreSettingsSave')}
                    </Button>
                </div>
            </Form.Group>
        </fieldset>;
    }, [hasForm, isInputChecked, apikey, url, isCoreV4]);

    return <div className="form-group-wrapper">
        <Form.Group onClick={() => handleClick()} className={`${isDisabled ? 'disabled' : ''}`}>
            <Form.Check type="checkbox" label={label} onChange={() => handleClick()} checked={isInputChecked} disabled={isDisabled} ref={checkboxRef} />
        </Form.Group>
        <div className='other-content'>
            {otherContent && otherContent}
        </div>
        {formDom}
    </div>;
};

Checkbox.propTypes = {
    label: PropTypes.node,
    isChecked: PropTypes.bool,
    isDisabled: PropTypes.bool,
    otherContent: PropTypes.node,
    hasForm: PropTypes.bool,
    handleCheckboxChange: PropTypes.func,
    labelFor: PropTypes.string,
    coreApikey: PropTypes.string,
    coreUrl: PropTypes.string
};

export default Checkbox;
