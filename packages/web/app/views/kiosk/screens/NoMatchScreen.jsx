import React, { useState } from 'react';

import { formatLongDate } from '@tamanu/ui-components';

import { TranslatedText } from '../../../components';
import { useTranslation } from '../../../contexts/Translation';
import { toDateOfBirth } from '../kioskDates';
import { AlertIcon } from '../KioskIcons';
import { GoToReceptionDialog } from '../KioskModals';
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
  const [isGoToReceptionOpen, setIsGoToReceptionOpen] = useState(false);
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
          stringId="kiosk.noMatch.checkDetails"
          fallback="Please check the details below are correct."
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
          <dd>{dateOfBirth && formatLongDate(dateOfBirth, getTranslation)}</dd>
        </div>
      </SummaryList>
      <CentredActions>
        <SecondaryButton $wide onClick={() => setIsGoToReceptionOpen(true)}>
          <TranslatedText
            stringId="kiosk.noMatch.detailsCorrect"
            fallback="My details are correct"
          />
        </SecondaryButton>
        <PrimaryButton $wide onClick={() => dispatch({ type: 'editSearch' })}>
          <TranslatedText stringId="kiosk.noMatch.reEnter" fallback="Re-enter details" />
        </PrimaryButton>
      </CentredActions>
      {isGoToReceptionOpen && <GoToReceptionDialog onCloseSession={onEndSession} />}
    </Panel>
  );
};
