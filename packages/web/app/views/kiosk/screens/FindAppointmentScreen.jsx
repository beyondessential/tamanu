import React, { useId, useState } from 'react';
import styled from 'styled-components';

import { DateParts } from '@tamanu/ui-components';

import { TranslatedText } from '../../../components';
import { useFindKioskAppointmentsMutation } from '../kioskApi';
import { toDateOfBirth } from '../kioskDates';
import { BackIcon } from '../KioskIcons';
import { useKioskSession } from '../KioskSession';
import {
  Actions,
  ErrorMessage,
  FieldLabel,
  KioskInput,
  KioskSelect,
  Lead,
  Panel,
  PrimaryButton,
  scaled,
  SecondaryButton,
  Title,
} from '../kioskStyles';

const Form = styled.form`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Fields = styled.div`
  width: 100%;
  max-width: ${scaled(600)};
  margin: 0 auto;
`;

const Field = styled.div`
  margin-bottom: ${scaled(26)};
`;

const Fieldset = styled.fieldset`
  margin: 0 0 ${scaled(26)};
  padding: 0;
  border: none;

  legend {
    padding: 0;
  }
`;

export const FindAppointmentScreen = ({ onEndSession }) => {
  const { session, dispatch } = useKioskSession();
  const [search, setSearch] = useState(session.search);
  const findAppointments = useFindKioskAppointmentsMutation();
  const idPrefix = useId();

  const dateOfBirth = toDateOfBirth(search);
  const lastName = search.lastName.trim();
  const canSearch = Boolean(lastName && dateOfBirth) && !findAppointments.isLoading;

  const handleSubmit = event => {
    event.preventDefault();
    if (!canSearch) return;
    findAppointments.mutate(
      { lastName, dateOfBirth },
      {
        onSuccess: ({ data, isSeveralPatients }) =>
          dispatch({ type: 'searched', search, matches: data, isSeveralPatients }),
      },
    );
  };

  // The keyboard's Next or Enter moves on to the next field still to fill in. Browsers don't
  // submit a form whose submit button is disabled, so Enter is handled here.
  const handleKeyDown = event => {
    if (event.key !== 'Enter' || canSearch) return;
    event.preventDefault();
    const fields = [...event.currentTarget.querySelectorAll('input, select')];
    const current = fields.indexOf(event.target);
    const nextEmpty = [...fields.slice(current + 1), ...fields].find(field => !field.value);
    nextEmpty?.focus();
  };

  return (
    <Panel>
      <Form onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate>
        <Fields>
          <Title>
            <TranslatedText stringId="kiosk.find.title" fallback="Find your appointment" />
          </Title>
          <Lead>
            <TranslatedText
              stringId="kiosk.find.text"
              fallback="Enter your details as they appear on your patient record."
            />
          </Lead>
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-lastName`}>
              <TranslatedText
                stringId="general.localisedField.lastName.label"
                fallback="Last name"
              />
            </FieldLabel>
            <KioskInput
              id={`${idPrefix}-lastName`}
              value={search.lastName}
              onChange={event => setSearch({ ...search, lastName: event.target.value })}
              autoComplete="off"
              autoCapitalize="words"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              data-testid="kiosk-last-name"
            />
          </Field>
          <Fieldset>
            <FieldLabel as="legend">
              <TranslatedText
                stringId="general.localisedField.dateOfBirth.label"
                fallback="Date of birth"
              />
            </FieldLabel>
            <DateParts
              parts={search}
              onChange={setSearch}
              Input={KioskInput}
              Select={KioskSelect}
              partProps={{
                day: { 'data-testid': 'kiosk-dob-day' },
                month: { 'data-testid': 'kiosk-dob-month' },
                year: { 'data-testid': 'kiosk-dob-year', enterKeyHint: 'search' },
              }}
            />
          </Fieldset>
          {findAppointments.isError && (
            <ErrorMessage role="alert">
              <TranslatedText
                stringId="kiosk.find.error"
                fallback="Something went wrong. Please try again, or go to reception."
              />
            </ErrorMessage>
          )}
        </Fields>
        <Actions>
          <SecondaryButton onClick={onEndSession}>
            <BackIcon />
            <TranslatedText stringId="general.action.back" fallback="Back" />
          </SecondaryButton>
          <PrimaryButton type="submit" $wide disabled={!canSearch} data-testid="kiosk-find">
            {findAppointments.isLoading ? (
              <TranslatedText stringId="kiosk.find.searching" fallback="Finding…" />
            ) : (
              <TranslatedText stringId="kiosk.find.submit" fallback="Find my appointment" />
            )}
          </PrimaryButton>
        </Actions>
      </Form>
    </Panel>
  );
};
