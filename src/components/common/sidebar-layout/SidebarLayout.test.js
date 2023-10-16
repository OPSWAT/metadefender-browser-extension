import { Link } from '@reach/router';
import { shallow } from 'enzyme';
import React from 'react';
import { Col } from 'react-bootstrap';
import SliderLayout from './SidebarLayout';


jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn(),
  }));

describe('SidebarLayout', () => {
    const ContentComponent = <div className="mock-content">This is a mock content component</div>;

    const sliderLayoutWrapper = shallow(<SliderLayout content={ContentComponent} currentPage='about' className="mock" />);

    it('should render correct', () => {
        expect(sliderLayoutWrapper.find(Col)).toHaveLength(3);
        expect(sliderLayoutWrapper.find(Col).at(2).find('.mock-content')).toHaveLength(1);
    });
});
