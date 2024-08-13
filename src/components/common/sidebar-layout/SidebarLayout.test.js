import React from 'react';
import { shallow } from 'enzyme';
import SidebarLayout from './SidebarLayout';
import { Col } from 'react-bootstrap';
import { Link } from '@reach/router';
import Header from '../header/Header';
import { useNavigate } from 'react-router-dom';

// Mock useNavigate hook
jest.mock('react-router-dom', () => ({
    useNavigate: jest.fn(),
}));

describe('SidebarLayout', () => {
    const mockNavigate = jest.fn();
    const ContentComponent = <div className="mock-content">This is a mock content component</div>;

    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
    });

    it('should render correctly with the provided content and currentPage', () => {
        const wrapper = shallow(<SidebarLayout content={ContentComponent} currentPage='about' className="mock" />);

        expect(wrapper.find(Col)).toHaveLength(3);
        expect(wrapper.find(Header)).toHaveLength(1);
        expect(wrapper.find('.mock-content')).toHaveLength(1);
        expect(wrapper.find('.sidebar--layout.mock')).toHaveLength(1);
        expect(wrapper.find(Link)).toHaveLength(3); // There are 3 menu items
        expect(wrapper.find(Link).at(2).prop('className')).toContain('active'); // 'about' page should be active
    });

    it('should apply active class to the correct menu item based on currentPage', () => {
        const wrapper = shallow(<SidebarLayout content={ContentComponent} currentPage='settings' className="mock" />);

        expect(wrapper.find(Link).at(1).prop('className')).toContain('active'); // 'settings' page should be active
    });

    it('should navigate to the correct page when a different menu item is clicked', () => {
        const wrapper = shallow(<SidebarLayout content={ContentComponent} currentPage='about' className="mock" />);

        wrapper.find(Link).at(0).simulate('click'); // Simulate clicking the first menu item ('history')

        expect(mockNavigate).toHaveBeenCalledWith('/history');
    });

    it('should not navigate when the same menu item is clicked', () => {
        const wrapper = shallow(<SidebarLayout content={ContentComponent} currentPage='about' className="mock" />);

        wrapper.find(Link).at(2).simulate('click'); // Simulate clicking the 'about' menu item (already active)

        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should render the correct number of menu items', () => {
        const wrapper = shallow(<SidebarLayout content={ContentComponent} currentPage='about' className="mock" />);

        expect(wrapper.find(Link)).toHaveLength(3); // Ensure there are 3 menu items
    });

    it('should pass the correct className to the main div', () => {
        const wrapper = shallow(<SidebarLayout content={ContentComponent} currentPage='about' className="custom-class" />);

        expect(wrapper.find('.sidebar--layout.custom-class')).toHaveLength(1); // Ensure the custom class is applied
    });
});
