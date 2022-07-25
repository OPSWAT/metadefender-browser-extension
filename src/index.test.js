import ReactDOM from 'react-dom';

describe('index', () => {
    const renderSpy = jest.spyOn(ReactDOM, 'render');

    it('should render correct', () => {
        require('./index');

        expect(renderSpy).toHaveBeenCalled();
    });
});