import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsContext, TranslatedText } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../../helpers';
import { SearchMultiSelectInput } from '../../../app/components/Field/SearchMultiSelectField';

const options = Array.from({ length: 12 }, (_, index) => ({
  value: `option-${index}`,
  label: `Option ${index}`,
}));

describe('SearchMultiSelectInput', () => {
  it('accepts a translated label alongside the option search box', async () => {
    renderElementWithTranslatedText(
      <SettingsContext.Provider value={{ getSetting: () => false }}>
        <SearchMultiSelectInput
          name="searchFields"
          value={[]}
          onChange={() => {}}
          options={options}
          label={
            <TranslatedText stringId="admin.settings.searchFields.label" fallback="Search fields" />
          }
        />
      </SettingsContext.Provider>,
    );

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByTestId('styledtextinput-ryvy-searchFields')).toBeDefined();
  });
});
