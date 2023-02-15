import React from 'react';
import { shallow } from 'enzyme';
import Checkbox from './Checkbox';
import { Button, Form } from 'react-bootstrap';

describe('Checkbox', () => {
    const handleCheckboxChange = jest.fn();

    const props = {
        label: 'Checkbox label',
        labelFor: 'Checkbox labelFor',
        isChecked: false,
        isDisabled: true,
        handleCheckboxChange,
    };

    it('should render disabled', () => {
        const checkboxWrapper = shallow(<Checkbox {...props} />);

        const checkboxProps = checkboxWrapper.find(Form.Check).props();

        expect.assertions(3);
        expect(checkboxProps.disabled).toEqual(props.isDisabled);
        expect(checkboxProps.label).toEqual(props.label);

        expect(checkboxWrapper.find('.disabled')).toHaveLength(1);
    });

    it('should render disabled checked', () => {
        const isChecked = true;
        const checkboxWrapper = shallow(<Checkbox {...props} isChecked={isChecked} />);

        const checkboxProps = checkboxWrapper.find(Form.Check).props();

        expect.assertions(2);
        expect(checkboxProps.disabled).toEqual(props.isDisabled);
        expect(checkboxProps.checked).toEqual(isChecked);
    });

    it('should render with form', () => {
        const checkboxWrapper = shallow(<Checkbox {...props} hasForm={true} />);

        expect.assertions(1);
        expect(checkboxWrapper.find('fieldset.form-with-inputs')).toHaveLength(1);
    });

    it('should render with form and call handleCheckboxChange on button click', () => {
        const checkboxWrapper = shallow(<Checkbox {...props} hasForm={true} />);

        checkboxWrapper.find(Form.Control).at(0).simulate('change', { target: { value: 'apikey' } });
        checkboxWrapper.find(Form.Control).at(1).simulate('change', { target: { value: 'url' } });

        checkboxWrapper.find(Button).simulate('click');

        expect(handleCheckboxChange).toHaveBeenCalledWith('coreSettings', { apikey: 'apikey', url: 'url' });
    });

    it('should render with other content', () => {
        const otherContent = <div className='other-content'>This is other contnetn</div>;
        const checkboxWrapper = shallow(<Checkbox {...props} otherContent={otherContent} />);

        expect.assertions(1);
        expect(checkboxWrapper.find('.other-content')).toHaveLength(1);
    });

    it('should call handleCheckboxChange on lable click', () => {
        const checkboxWrapper = shallow(<Checkbox {...props} isDisabled={false} />);

        checkboxWrapper.find(Form.Group).simulate('click');

        expect(handleCheckboxChange).toHaveBeenCalledWith(props.labelFor);
    });
});