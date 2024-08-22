import React from 'react';
import { shallow } from 'enzyme';
import Checkbox from './Checkbox';
import { Button, Form } from 'react-bootstrap';

describe('Checkbox', () => {
    const handleCheckboxChange = jest.fn();
    const getScanRules = jest.fn();
    const validateCoreSettings = jest.fn().mockResolvedValue(true);

    const defaultProps = {
        label: 'Checkbox label',
        labelFor: 'Checkbox labelFor',
        isChecked: false,
        isDisabled: true,
        handleCheckboxChange,
        getScanRules,
        validateCoreSettings,
        hasForm: false,
        hasFormApikey: false,
        fileSizeLimit: null,
        coreApikey: '',
        coreUrl: '',
        coreRule: '',
        scanRules: [],
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should render disabled', () => {
        const checkboxWrapper = shallow(<Checkbox {...defaultProps} />);

        const checkboxProps = checkboxWrapper.find(Form.Check).props();

        expect(checkboxProps.disabled).toEqual(defaultProps.isDisabled);
        expect(checkboxProps.label).toEqual(defaultProps.label);
        expect(checkboxWrapper.find('.disabled')).toHaveLength(1);
    });

    it('should render disabled and checked', () => {
        const isChecked = true;
        const checkboxWrapper = shallow(<Checkbox {...defaultProps} isChecked={isChecked} />);

        const checkboxProps = checkboxWrapper.find(Form.Check).props();

        expect(checkboxProps.disabled).toEqual(defaultProps.isDisabled);
        expect(checkboxProps.checked).toEqual(isChecked);
    });

    it('should render with a form when hasForm is true', () => {
        const checkboxWrapper = shallow(<Checkbox {...defaultProps} hasForm={true} />);

        expect(checkboxWrapper.find('fieldset.form-with-inputs')).toHaveLength(1);
    });

    it('should display an error message if URL is invalid', async () => {
        validateCoreSettings.mockResolvedValue(false);

        const checkboxWrapper = shallow(<Checkbox {...defaultProps} hasForm={true} />);
        checkboxWrapper.find(Form.Control).at(1).simulate('change', { target: { value: 'invalid-url' } });
        checkboxWrapper.find(Button).simulate('click');

        await checkboxWrapper.update();

        expect(checkboxWrapper.find('.red').text()).toEqual('');
    });

    it('should render with other content', () => {
        const otherContent = <div className='other-content'>This is other content</div>;
        const checkboxWrapper = shallow(<Checkbox {...defaultProps} otherContent={otherContent} />);

        expect(checkboxWrapper.find('.other-content')).toHaveLength(2);
    });

    it('should call handleCheckboxChange on label click when not disabled', () => {
        const checkboxWrapper = shallow(<Checkbox {...defaultProps} isDisabled={false} />);

        checkboxWrapper.find(Form.Group).simulate('click');

        expect(handleCheckboxChange).toHaveBeenCalledWith(defaultProps.labelFor);
    });

    it('should not call handleCheckboxChange on label click when disabled', () => {
        const checkboxWrapper = shallow(<Checkbox {...defaultProps} isDisabled={true} />);

        checkboxWrapper.find(Form.Group).simulate('click');

        expect(handleCheckboxChange).not.toHaveBeenCalled();
    });

    it('should disable form inputs when checkbox is unchecked', () => {
        const checkboxWrapper = shallow(<Checkbox {...defaultProps} isChecked={false} hasForm={true} />);

        expect(checkboxWrapper.find('fieldset.form-with-inputs').props().disabled).toBe(true);
    });

    it('should enable form inputs when checkbox is checked', () => {
        const checkboxWrapper = shallow(<Checkbox {...defaultProps} isChecked={true} hasForm={true} />);

        expect(checkboxWrapper.find('fieldset.form-with-inputs').props().disabled).toBe(false);
    });

    it('should call getScanRules when Apikey or URL input is blurred', () => {
        const checkboxWrapper = shallow(<Checkbox {...defaultProps} hasForm={true} />);

        checkboxWrapper.find(Form.Control).at(0).simulate('blur');
        checkboxWrapper.find(Form.Control).at(1).simulate('blur');

        expect(getScanRules).toHaveBeenCalledTimes(2);
    });
});
