import React from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { Field, Form, MultiselectInput, ReadOnlyFormProvider } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../helpers/render';

/** Stands in for a real field, so the test reads what the context does to whatever it renders. */
const ProbeInput = ({ field, disabled }) => (
  <input data-testid={`probe-${field.name}`} disabled={Boolean(disabled)} readOnly />
);

const renderForm = ({ readOnly, name = 'firstName', disabled }) =>
  renderElementWithTranslatedText(
    <ReadOnlyFormProvider readOnly={readOnly}>
      <Form
        initialValues={{ [name]: 'Ada' }}
        onSubmit={() => {}}
        render={() => <Field name={name} component={ProbeInput} disabled={disabled} />}
      />
    </ReadOnlyFormProvider>,
  );

describe('read-only forms', () => {
  it('disables a field beneath the provider without the field being told', () => {
    renderForm({ readOnly: true });

    expect(screen.getByTestId('probe-firstName').disabled).toBe(true);
  });

  it('leaves a field editable when the form is not read-only', () => {
    renderForm({ readOnly: false });

    expect(screen.getByTestId('probe-firstName').disabled).toBe(false);
  });

  // A field that disables itself for its own reasons must stay disabled on an editable form.
  it('keeps a field that disables itself disabled', () => {
    renderForm({ readOnly: false, disabled: true });

    expect(screen.getByTestId('probe-firstName').disabled).toBe(true);
  });
});

describe('a disabled multiselect', () => {
  const PLANS = [
    { value: 'plan-1', label: 'Sliding fee scale' },
    { value: 'plan-2', label: 'National insurance' },
  ];

  const renderPlans = value =>
    renderElementWithTranslatedText(
      <MultiselectInput
        name="invoiceInsurancePlanId"
        options={PLANS}
        value={value}
        onChange={() => {}}
        form={{ initialValues: {} }}
        disabled
      />,
    );

  const displayedValue = () => screen.getByRole('textbox').value;

  // Matching a list of values against one option's value finds nothing, which once left the field
  // blank and lost the patient's plans whenever the form was shown read-only.
  it('lists every selected label rather than reading as empty', () => {
    renderPlans(['plan-1', 'plan-2']);

    expect(displayedValue()).toBe('Sliding fee scale, National insurance');
  });

  it('reads the list back from the stored JSON form of the value', () => {
    renderPlans(JSON.stringify(['plan-2']));

    expect(displayedValue()).toBe('National insurance');
  });

  it('shows nothing when no plan is selected', () => {
    renderPlans([]);

    expect(displayedValue()).toBe('');
  });
});
