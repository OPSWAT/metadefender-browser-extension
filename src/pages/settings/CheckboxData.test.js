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
        expect(firstItem.isDisabled).toBe(false);
        expect(firstItem.labelFor).toBe('scanDownloads');

        const secondItem = checkboxData[1];
        expect(secondItem.label).toEqual(<p className="label" dangerouslySetInnerHTML={{ __html: undefined }} />);
        expect(secondItem.isDisabled).toBe(false);
        expect(secondItem.labelFor).toBe('shareResults');

        const thirdItem = checkboxData[2];
        expect(thirdItem.label).toEqual(<p className="label" dangerouslySetInnerHTML={{ __html: undefined }} />);
        expect(thirdItem.labelFor).toBe("showNotifications");
        expect(thirdItem.isDisabled).toBeUndefined();

    });

    it('disables checkboxes when conditions are not met', () => {
        const checkboxData = CheckboxData(false, false);

        expect(checkboxData[0].isDisabled).toBe(true);

        expect(checkboxData[1].isDisabled).toBe(true);
    });

    it('does not call chrome.tabs.query when clicking the link', () => {
        const checkboxData = CheckboxData(isPaidUser, isAllowedFileSchemeAccess);
        const firstItem = checkboxData[0];

        const anchor = firstItem.otherContent.props.children[1].props.children;
        const mockClickEvent = { preventDefault: jest.fn() };

        anchor?.props?.onClick(mockClickEvent);

        expect(global.chrome.tabs.query).toHaveBeenCalledTimes(0);
        expect(global.chrome.tabs.update).toHaveBeenCalledTimes(0);
    });
})

describe('CheckboxData function - scanDownloads', () => {
    const isAllowedFileSchemeAccess = true;
    const isPaidUser = true;

    it('calls chrome.tabs.query and chrome.tabs.update correctly when the link is clicked', async () => {
        const checkboxData = CheckboxData(isPaidUser, isAllowedFileSchemeAccess);

        const firstItem = checkboxData[0];

        let testRenderer;
        await act(async () => {
            testRenderer = TestRenderer.create(firstItem.otherContent);
        });

        const testInstance = testRenderer.root;

        const anchor = testInstance.findByType('a');
        const mockClickEvent = { preventDefault: jest.fn() };

        act(() => {
            anchor.props.onClick(mockClickEvent);
        });

        expect(global.chrome.tabs.query).toHaveBeenCalledWith(
            { url: `chrome://extensions/?id=testid123` },
            expect.any(Function)
        );

        const queryCallback = global.chrome.tabs.query.mock.calls[0][1];

        queryCallback([]);

        expect(global.chrome.tabs.update).toHaveBeenCalledWith({
            url: `chrome://extensions/?id=testid123`,
        });

        global.chrome.tabs.update.mockClear();

        queryCallback([{ id: 1 }]);

        expect(global.chrome.tabs.update).toHaveBeenCalledWith(1, { active: true });
    });
});