import { screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import { PaginatedForm } from '../../../app/components/Field/PaginatedForm';
import { renderElementWithTranslatedText } from '../../helpers/render';

const STEPPER = 'styledstepper-6u8v';

const Screen = ({ children }) => <div>{children}</div>;

const renderWithScreens = screens =>
  renderElementWithTranslatedText(
    <PaginatedForm onSubmit={() => {}} onCancel={() => {}}>
      {screens}
    </PaginatedForm>,
  );

describe('PaginatedForm', () => {
  it('draws no stepper for a single-screen form', () => {
    renderWithScreens(
      <Screen>
        <div>Only screen</div>
      </Screen>,
    );

    expect(screen.queryByTestId(STEPPER)).toBeNull();
  });

  it('draws a stepper for a form with more than one screen', () => {
    renderWithScreens([
      <Screen key="one">
        <div>First screen</div>
      </Screen>,
      <Screen key="two">
        <div>Second screen</div>
      </Screen>,
    ]);

    expect(screen.getByTestId(STEPPER)).toBeDefined();
  });
});
