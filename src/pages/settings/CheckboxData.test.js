import CheckboxData from "./CheckboxData";
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

global.chrome = {
    i18n: {
        getMessage: jest.fn((key) => key),
    },
    runtime: {
        id: 'testid123',
    },
    tabs: {
        query: jest.fn(),
        update: jest.fn(),
    }
};

describe('CheckboxData function', () => {
    const isPaidUser = true;
    const isAllowedFileSchemeAccess = true;

    it('returns the correct number of checkbox items', () => {
        const checkboxData = CheckboxData(isPaidUser, isAllowedFileSchemeAccess);
        expect(checkboxData.length).toBe(9);
    });

    it('returns correct labels and properties for each checkbox item', () => {
        const checkboxData = CheckboxData(isPaidUser, isAllowedFileSchemeAccess);

        const firstItem = checkboxData[0];
        expect(firstItem.label).toEqual(<p className="label" dangerouslySetInnerHTML={{ __html: undefined }} />);
        expect(firstItem.isDisabled).toBe(true);
        expect(firstItem.labelFor).toBe('scanDownloads');

        const secondItem = checkboxData[1];
        expect(secondItem.label).toEqual(<p className="label" dangerouslySetInnerHTML={{ __html: undefined }} />);
        expect(secondItem.isDisabled).toBe(true);
        expect(secondItem.labelFor).toBe('shareResults');

        const thirdItem = checkboxData[2];
        expect(thirdItem.label).toEqual(<p className="label" dangerouslySetInnerHTML={{ __html: undefined }} />);
        expect(thirdItem.labelFor).toBe("showNotifications");
        expect(thirdItem.isDisabled).toBe(true);

    });

    it('disables checkboxes when conditions are not met', () => {
        const checkboxData = CheckboxData(false, false);

        expect(checkboxData[0].isDisabled).toBe(false);

        expect(checkboxData[1].isDisabled).toBe(true);
    });

    it('does not call chrome.tabs.query when clicking the link', () => {
        const checkboxData = CheckboxData(isPaidUser, isAllowedFileSchemeAccess);
        const firstItem = checkboxData[0];

        const anchor = firstItem.otherContent?.props?.children[1].props.children;
        const mockClickEvent = { preventDefault: jest.fn() };

        anchor?.props?.onClick(mockClickEvent);

        expect(global.chrome.tabs.query).toHaveBeenCalledTimes(0);
        expect(global.chrome.tabs.update).toHaveBeenCalledTimes(0);
    });
})

