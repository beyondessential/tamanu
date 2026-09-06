import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { Formik } from 'formik';
import { facilitySettings } from '@tamanu/settings';
import { SettingsContext } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../../../helpers';
import { SettingInput } from '../../../../app/views/administration/settings/components/SettingInput';

// Suggesters need the ApiContext, and a number input has none.
vi.mock('../../../../app/api', async importOriginal => ({
  ...(await importOriginal()),
  useSuggester: () => ({}),
}));

// The shipped node, so this pins the real setting rather than a stand-in: a nullable number
// whose default is "unset", the first of that shape in the schema.
const PATH = 'tasking.encounterOverdueTasksTimeFrame';
const node = facilitySettings.properties.tasking.properties.encounterOverdueTasksTimeFrame;

const renderInput = (value) => {
  const handleChangeSetting = vi.fn();
  const build = (v) => (
    <SettingsContext.Provider value={{ getSetting: () => undefined }}>
      <Formik initialValues={{ settings: {} }} onSubmit={() => {}}>
        <SettingInput
          path={PATH}
          settingsPath={PATH}
          name="Encounter overdue tasks time frame"
          description={node.description}
          value={v}
          defaultValue={node.defaultValue}
          typeSchema={node.type}
          unit={node.unit}
          handleChangeSetting={handleChangeSetting}
        />
      </Formik>
    </SettingsContext.Provider>
  );
  const { rerender } = renderElementWithTranslatedText(build(value));
  return {
    handleChangeSetting,
    input: screen.getByRole('spinbutton'),
    setValue: (v) => rerender(build(v)),
  };
};

describe('SettingInput for a nullable number', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an unset value as an empty field rather than zero', () => {
    const { input } = renderInput(undefined);

    expect(input.value).toBe('');
  });

  it('stores a typed value as a number', () => {
    const { handleChangeSetting, input } = renderInput(undefined);

    fireEvent.change(input, { target: { value: '24' } });

    expect(handleChangeSetting).toHaveBeenCalledWith(PATH, 24);
  });

  it('clears back to no override when the field is emptied', () => {
    // The empty field must not reach the form as '', which the schema rejects. It means
    // "no override", which undefined says and the save turns into a deleted row.
    const { handleChangeSetting, input } = renderInput(24);

    fireEvent.change(input, { target: { value: '' } });

    expect(handleChangeSetting).toHaveBeenCalledWith(PATH, undefined);
    expect(screen.queryByText(/must be a `number` type/)).toBe(null);
  });

  it('flags a fractional value in place', () => {
    renderInput(0.5);

    expect(screen.queryByText(/must be an integer/)).not.toBe(null);
  });

  it('empties the field when the override is taken away', () => {
    // Reset to default hands back undefined without the field being typed in, so the
    // input has to stay controlled through the change or it keeps showing the old number.
    const { input, setValue } = renderInput(8);
    expect(input.value).toBe('8');

    setValue(undefined);

    expect(input.value).toBe('');
  });

  it('empties the field when the override taken away was invalid', () => {
    // The state a refused save leaves behind: the field still holds the rejected value.
    const { input, setValue } = renderInput(0.5);
    expect(input.value).toBe('0.5');

    setValue(undefined);

    expect(input.value).toBe('');
    expect(screen.queryByText(/must be an integer/)).toBe(null);
  });
});
