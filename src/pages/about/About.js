import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import React, { useContext } from 'react';
import { About } from './About';  

jest.mock('../../providers/GAProvider', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    gaTrackEvent: jest.fn(),
  })),
}));

jest.mock('../../providers/UserProvider', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    apikeyData: null,  
  })),
}));

global.chrome = {
  i18n: {
    getMessage: jest.fn((key) => key),
  },
};

jest.mock('../../assets/images/how-to/open-settings.png', () => 'open-settings.png');
jest.mock('../../assets/images/how-to/right-click.png', () => 'right-click.png');

describe('About Component', () => {
  test('renders About component', () => {
    render(<About />);

    expect(screen.getByText('aboutTitle')).toBeInTheDocument();
    expect(screen.getByText('aboutApiKeyInfo')).toBeInTheDocument();
    expect(screen.getByText('aboutHowToUse')).toBeInTheDocument();

  });
});
