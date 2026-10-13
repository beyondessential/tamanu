import React from 'react';

import { TranslatedText } from '../../../components';
import { useTranslation } from '../../../contexts/Translation';
import { formatDateOfBirth, toDateOfBirth } from '../kioskDates';
import { AlertIcon } from '../KioskIcons';
import { useKioskSession } from '../KioskSession';
import {
  CentredActions,
  Lead,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StateIcon,
  SummaryList,
  Title,
} from '../kioskStyles';

export const NoMatchScreen = ({ onEndSession }) => {
  const { session, dispatch } = useKioskSession();
  const { getTranslation } = useTranslation();
  const { search } = session;
  const dateOfBirth = toDateOfBirth(search);

  return (
    <Panel $centred>
      <StateIcon>
        <AlertIcon />
      </StateIcon>
      <Title>
        <TranslatedText
          stringId="kiosk.noMatch.title"
          fallback="We couldn't find your appointment"
        />
      </Title>
      <Lead>
        <TranslatedText
          stringId="kiosk.noMatch.text"
          fallback="Check your details below. If they're correct, please go to reception."
        />
      </Lead>
      <SummaryList>
        <div>
          <dt>
            <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />
          </dt>
          <dd>{search.lastName.trim()}</dd>
        </div>
        <div>
          <dt>
            <TranslatedText
              stringId="general.localisedField.dateOfBirth.label"
              fallback="Date of birth"
            />
          </dt>
          <dd>{dateOfBirth && formatDateOfBirth(dateOfBirth, getTranslation)}</dd>
        </div>
      </SummaryList>
      <CentredActions>
        <SecondaryButton $wide onClick={onEndSession}>
          <TranslatedText stringId="general.action.close" fallback="Close" />
        </SecondaryButton>
        <PrimaryButton $wide onClick={() => dispatch({ type: 'editSearch' })}>
          <TranslatedText stringId="kiosk.noMatch.edit" fallback="Edit details" />
        </PrimaryButton>
      </CentredActions>
    </Panel>
  );
};
