import React from 'react';
import { VACCINE_STATUS } from '@tamanu/constants/vaccines';
import {
  TranslatedText,
  DateDisplay,
  MenuButton,
  OutlinedButton,
  StatusTag,
} from '../../components';
import { Colors } from '../../constants';
import styled from 'styled-components';

export const getSchedule = record =>
  record.scheduledVaccine?.schedule || (
    <TranslatedText stringId="general.fallback.notApplicable" fallback="N/A" />
  );
export const getVaccineName = record =>
  record.vaccineName ||
  record.scheduledVaccine?.label || (
    <TranslatedText stringId="general.fallback.unknown" fallback="Unknown" />
  );
export const getDate = ({ date }) =>
  date ? (
    <DateDisplay date={date} />
  ) : (
    <TranslatedText stringId="general.fallback.unknown" fallback="Unknown" />
  );
export const getGiver = record => {
  if (record.status === VACCINE_STATUS.NOT_GIVEN) {
    return (
      <StatusTag $background="#4444441a" $color={Colors.darkestText}>
        <TranslatedText stringId="vaccine.property.status.notGiven" fallback="Not given" />
      </StatusTag>
    );
  }
  if (record.givenElsewhere) {
    return (
      <TranslatedText
        stringId="vaccine.property.status.givenElsewhere"
        fallback="Given elsewhere"
      />
    );
  }
  return (
    record.givenBy || <TranslatedText stringId="general.fallback.unknown" fallback="Unknown" />
  );
};
export const getFacility = record => {
  const facility = record.givenElsewhere ? record.givenBy : record.location?.facility?.name;
  return facility || '';
};

const ActionButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const MarginedMenuButton = styled(MenuButton)`
  margin-left: 15px;
`;

export const getActionButtons = ({ onItemClick, onItemEditClick, onItemDeleteClick }) => record => {
  return (
    <ActionButtonsContainer>
      <OutlinedButton onClick={() => onItemClick(record)}>
        <TranslatedText stringId="general.action.view" fallback="View" />
      </OutlinedButton>
      <MarginedMenuButton
        iconColor={Colors.primary}
        actions={[
          {
            label: <TranslatedText stringId="general.action.edit" fallback="Edit" />,
            action: () => onItemEditClick(record),
          },
          {
            label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
            action: () => onItemDeleteClick(record),
          },
        ]}
      />
    </ActionButtonsContainer>
  );
};
