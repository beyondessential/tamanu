import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext, DateTimeProvider, SettingsContext } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../../helpers';
import { DateSelector } from '../../../app/views/scheduling/outpatientBookings/DateSelector';

// Regression test for packages/web/app/views/scheduling/outpatientBookings/DateSelector.jsx.
//
// handleOnKeyDown was bound to the outer Wrapper, which also contains the
// editable month input, so ArrowLeft/ArrowRight typed into that input bubbled
// up and mutated the selected date instead of moving the cursor in the input.
// The fix scopes the handler to the day strip only.

vi.mock('../../../app/components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    // Replace the MUI month/year picker with a plain text input so we can
    // focus it and dispatch key events without pulling in date pickers.
    MonthPicker: props => <input onChange={() => {}} value="" {...props} />,
  };
});

const renderDateSelector = (value, onChange) =>
  renderElementWithTranslatedText(
    <AuthContext.Provider value={{ primaryTimeZone: 'Pacific/Auckland' }}>
      <SettingsContext.Provider value={{ getSetting: () => undefined }}>
        <DateTimeProvider>
          <DateSelector value={value} onChange={onChange} />
        </DateTimeProvider>
      </SettingsContext.Provider>
    </AuthContext.Provider>,
  );

describe('DateSelector keyboard navigation scope', () => {
  it('does not change the selected date when arrow keys are pressed in the month input', async () => {
    const user = userEvent.setup();
    const selectedDate = new Date(2024, 3, 15); // 15 Apr 2024
    const onChange = vi.fn();

    renderDateSelector(selectedDate, onChange);

    const monthInput = screen.getByTestId('styledmonthpicker-3pmc');
    monthInput.focus();
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowRight}');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('navigates and focuses adjacent days without throwing at the first day', async () => {
    const user = userEvent.setup();
    const selectedDate = new Date(2024, 3, 15); // 15 Apr 2024
    const onChange = vi.fn();

    const { rerender } = renderDateSelector(selectedDate, onChange);

    const firstDay = new Date(2024, 3, 1);
    const firstDayButton = screen.getByTestId(/daywrapper-2vbq-.*-1$/);
    firstDayButton.focus();

    await expect(
      user.keyboard('{ArrowLeft}'),
    ).resolves.not.toThrow();

    // Re-render with the first day selected, mirroring parent state update.
    rerender(
      <AuthContext.Provider value={{ primaryTimeZone: 'Pacific/Auckland' }}>
        <SettingsContext.Provider value={{ getSetting: () => undefined }}>
          <DateTimeProvider>
            <DateSelector value={firstDay} onChange={onChange} />
          </DateTimeProvider>
        </SettingsContext.Provider>
      </AuthContext.Provider>,
    );

    const secondDayButton = screen.getByTestId(/daywrapper-2vbq-.*-2$/);
    secondDayButton.focus();

    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenCalled();
  });
});
