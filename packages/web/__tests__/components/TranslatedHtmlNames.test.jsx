import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { replaceStringVariables } from '@tamanu/shared/utils/translation/translationFactory';

import { renderElementWithTranslatedText } from '../helpers/render';

const MARKUP_NAME = '<img src=x onerror="window.__injected = true">Mallory';

const mockPatient = vi.hoisted(() => ({ id: 'patient-1', firstName: '', lastName: '' }));
vi.mock('../../app/contexts/Patient', () => ({ usePatient: () => ({ patient: mockPatient }) }));
vi.mock('../../app/api', () => ({ useApi: () => ({}) }));

const { DeleteOngoingConditionModal } = await import(
  '../../app/components/PatientInfoPane/DeleteOngoingConditionModal'
);
const { AddReminderContact } = await import('../../app/components/ReminderContact/AddReminderContact');

const translationContext = {
  getTranslation: (_stringId, fallback, options) => replaceStringVariables(fallback, options),
  updateStoredLanguage: () => {},
  storedLanguage: 'aa',
  translations: {},
};

describe('translations rendered as HTML', () => {
  afterEach(() => {
    cleanup();
    delete window.__injected;
  });

  it('shows a condition name containing markup as text', () => {
    renderElementWithTranslatedText(
      <DeleteOngoingConditionModal
        open
        onClose={() => {}}
        conditionToDelete={{ id: 'c1', condition: { name: MARKUP_NAME } }}
      />,
      undefined,
      translationContext,
    );
    const subText = screen.getByTestId('subtext-delete-condition');
    expect(subText.querySelector('img')).toBeNull();
    expect(subText.querySelector('b').textContent).toBe(MARKUP_NAME);
  });

  it('shows the patient name when adding a reminder contact', () => {
    mockPatient.firstName = 'Aroha';
    mockPatient.lastName = '<b>Te Rangi</b>';
    renderElementWithTranslatedText(<AddReminderContact />, undefined, translationContext);
    const subHeading = screen.getByTestId('formsubheading-72l1');
    expect(subHeading.textContent).not.toContain(':patientName');
    expect(subHeading.querySelector('span').textContent).toBe('Aroha <b>Te Rangi</b>');
    expect(subHeading.querySelector('b')).toBeNull();
  });
});
