import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import PropTypes from 'prop-types';

import './Checkbox.scss';

const Checkbox = ({ label, isChecked, isDisabled, otherContent, hasForm, handleCheckboxChange, labelFor }) => {
    const checkboxRef = useRef(null);
    const [isInputChecked, setIsInputChecked] = useState(typeof isChecked === 'boolean' ? isChecked : false);
    const [apikey, setApikey] = useState('');
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (typeof isChecked === 'boolean') {
            setIsInputChecked(isChecked);
        }
    }, [isChecked]);

    const handleClick = async (isCoreSettings) => {
        if (isCoreSettings) {
            const coreSettings = {
                apikey,
                url
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

    const formDom = useMemo(() => {
        if (!hasForm) {
            return;
        }

        return <fieldset className="form-with-inputs" disabled={isInputChecked ? false : true}>
            <Form.Group controlId="apiKey">
                <Form.Label className="col-md-2 col-sm-12 text-md-right text-left">Apikey</Form.Label>
                <Form.Control className="col-md-10 col-sm-12" type="text" placeholder="" onChange={handleApikeyChange} />
            </Form.Group>
            <Form.Group controlId="url">
                <Form.Label className="col-md-2 col-sm-12 text-md-right text-left">URL</Form.Label>
                <Form.Control className="col-md-10 col-sm-12" type="text" placeholder="" onChange={handleUrlChange} />
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
    }, [hasForm, isInputChecked, apikey, url]);

    return <div className="form-group-wrapper">
        <Form.Group onClick={() => handleClick()} className={`${isDisabled ? 'disabled' : ''}`}>
            <Form.Check type="checkbox" label={label} onChange={() => handleClick()} checked={isInputChecked} disabled={isDisabled} ref={checkboxRef} />
            {otherContent && otherContent}
        </Form.Group>
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
    labelFor: PropTypes.string
};

export default Checkbox;