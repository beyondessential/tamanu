import React from 'react';
import { parseISO, startOfWeek } from 'date-fns';
import { VACCINE_STATUS, VACCINE_STATUS_LABELS } from '@tamanu/constants/vaccines';
import styled from 'styled-components';
import {
  TranslatedText,
  DateDisplay,
  MenuButton,
  OutlinedButton,
  TableCellTag,
} from '../../components';
import { Colors } from '../../constants';

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

export const getDueDate = record => {
  if (!record.dueDate) {
    return <TranslatedText stringId="general.fallback.unknown" fallback="Unknown" />;
  }

  const mondayDate = startOfWeek(parseISO(record.dueDate), { weekStartsOn: 1 });
  return (
    <div style={{ width: '140px' }}>
      <TranslatedText stringId="general.date.weekOf" fallback="Week of" />{' '}
      <DateDisplay date={mondayDate} />
    </div>
  );
};
export const getGiver = record => {
  if (record.status === VACCINE_STATUS.NOT_GIVEN) {
    return (
      <TableCellTag $background="#4444441a" $color={Colors.darkestText}>
        <TranslatedText stringId="vaccine.property.status.notGiven" fallback="Not given" />
      </TableCellTag>
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

export const getRecordAction = onItemEdit => record => {
  return (
    <ActionButtonsContainer>
      <OutlinedButton onClick={() => onItemEdit(record)}>
        <TranslatedText stringId="general.action.record" fallback="Record" />
      </OutlinedButton>
    </ActionButtonsContainer>
  );
};

const VACCINE_STATUS_COLORS = {
  [VACCINE_STATUS.SCHEDULED]: '#4101C9',
  [VACCINE_STATUS.UPCOMING]: '#1172D1',
  [VACCINE_STATUS.DUE]: '#19934E',
  [VACCINE_STATUS.OVERDUE]: '#CB6100',
  [VACCINE_STATUS.MISSED]: '#F76853',
};

export const getStatusTag = ({ vaccineScheduleStatus }) => {
  const label = VACCINE_STATUS_LABELS[vaccineScheduleStatus] || vaccineScheduleStatus;
  const color = VACCINE_STATUS_COLORS[vaccineScheduleStatus];
  return (
    <TableCellTag $color={color} noWrap>
      {label}
    </TableCellTag>
  );
};
