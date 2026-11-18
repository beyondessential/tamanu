import React, { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { NOTIFICATION_STATUSES, NOTIFICATION_TYPES } from '@tamanu/constants';
import { replaceStringVariables } from '@tamanu/shared/utils/translation/translationFactory';

import { renderElementWithTranslatedText } from '../helpers/render';

const MARKUP_NAME = '<img src=x onerror="window.__injected = true">Mallory';

const mockPatient = vi.hoisted(() => ({ id: 'patient-1', firstName: '', lastName: '' }));
vi.mock('../../app/contexts/Patient', () => ({ usePatient: () => ({ patient: mockPatient }) }));
vi.mock('../../app/api', () => ({ useApi: () => ({}) }));
vi.mock('../../app/components/Field', () => ({
  LocalisedField: () => null,
  SuggesterSelectField: () => null,
}));
vi.mock('../../app/api/mutations', () => ({
  useMarkAsRead: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useMarkAllAsRead: () => ({ mutate: vi.fn(), isLoading: false }),
}));
vi.mock('../../app/api/queries', () => ({ useTelegramBotInfoQuery: () => ({}) }));
vi.mock('../../app/contexts/LabRequest', () => ({ useLabRequest: () => ({}) }));
vi.mock('../../app/contexts/Auth', () => ({ useAuth: () => ({ ability: { can: () => true } }) }));
vi.mock('../../app/utils/useSocket', () => ({
  useSocket: () => ({ socket: { on() {}, off() {} } }),
}));
const mockFetchedContactCount = vi.hoisted(() => ({ count: 1 }));
vi.mock('../../app/components/Table', () => ({
  Table: () => null,
  DataFetchingTable: ({ onDataFetched }) => {
    useEffect(() => onDataFetched(mockFetchedContactCount), [onDataFetched]);
    return null;
  },
}));
vi.mock('@tamanu/ui-components', async importOriginal => ({
  ...(await importOriginal()),
  DateDisplay: () => null,
  TimeDisplay: () => null,
}));

const { DeleteOngoingConditionModal } =
  await import('../../app/components/PatientInfoPane/DeleteOngoingConditionModal');
const { AddReminderContact } =
  await import('../../app/components/ReminderContact/AddReminderContact');
const { ContactDetails } = await import('../../app/components/ReminderContact/ContactDetails');
const { ReminderContactQR } =
  await import('../../app/components/ReminderContact/ReminderContactQR');
const { NotificationDrawer } = await import('../../app/components/Notification/NotificationDrawer');

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

  it('shows the patient name in the reminder contact list description', async () => {
    mockPatient.firstName = MARKUP_NAME;
    mockPatient.lastName = 'Te Rangi';
    mockFetchedContactCount.count = 1;
    renderElementWithTranslatedText(
      <ContactDetails pendingContacts={{}} successContactIds={[]} />,
      undefined,
      translationContext,
    );
    const description = await screen.findByTestId('styledtext-rxy4');
    expect(description.querySelector('img')).toBeNull();
    expect(description.querySelector('span').textContent).toBe(`${MARKUP_NAME} Te Rangi`);
  });

  it('shows the patient name when there are no reminder contacts', async () => {
    mockPatient.firstName = MARKUP_NAME;
    mockPatient.lastName = 'Te Rangi';
    mockFetchedContactCount.count = 0;
    renderElementWithTranslatedText(
      <ContactDetails pendingContacts={{}} successContactIds={[]} />,
      undefined,
      translationContext,
    );
    const description = await screen.findByTestId('styledtext-r6fj');
    expect(description.querySelector('img')).toBeNull();
    expect(description.querySelector('span').textContent).toBe(`${MARKUP_NAME} Te Rangi`);
  });

  it('shows the patient name in the reminder contact QR code description', () => {
    mockPatient.firstName = MARKUP_NAME;
    mockPatient.lastName = 'Te Rangi';
    renderElementWithTranslatedText(
      <ReminderContactQR contact={{ id: 'contact-1' }} onClose={() => {}} />,
      undefined,
      translationContext,
    );
    const description = screen.getByTestId('styledtext-4inx');
    expect(description.querySelector('img')).toBeNull();
    expect(description.querySelector('span').textContent).toBe(`${MARKUP_NAME} Te Rangi`);
  });

  it('shows patient details in a notification as text, keeping the template emphasis', () => {
    const notification = {
      id: 'notification-1',
      type: NOTIFICATION_TYPES.IMAGING_REQUEST,
      status: NOTIFICATION_STATUSES.UNREAD,
      createdTime: '2026-11-19 08:00:00',
      patient: {
        id: 'patient-1',
        firstName: MARKUP_NAME,
        lastName: 'Te Rangi',
        displayId: '<b>ABC123</b>',
      },
      metadata: { encounterId: 'encounter-1', id: 'imaging-1' },
    };
    renderElementWithTranslatedText(
      <MemoryRouter>
        <NotificationDrawer
          open
          onClose={() => {}}
          notifications={{ unreadNotifications: [notification] }}
          isLoading={false}
        />
      </MemoryRouter>,
      undefined,
      translationContext,
    );
    const text = screen.getByTestId('bodytext-xa84');
    expect(text.querySelector('img')).toBeNull();
    expect(text.querySelector('b')).toBeNull();
    expect(text.querySelector('strong').textContent).toBe('now available');
    expect(text.textContent).toBe(
      `Imaging results for ${MARKUP_NAME} Te Rangi (<b>ABC123</b>) are now available`,
    );
  });
});
