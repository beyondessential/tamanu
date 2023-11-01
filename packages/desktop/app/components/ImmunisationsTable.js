import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

import { VACCINE_STATUS } from '@tamanu/constants/vaccines';
import { OutlinedButton } from './Button';
import { MenuButton } from './MenuButton';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { StatusTag } from './Tag';
import { CheckInput } from './Field';
import { Colors } from '../constants';
import { TranslatedText } from './Translation/TranslatedText';

const getSchedule = record => record.scheduledVaccine?.schedule || 'N/A';
const getVaccineName = record => record.vaccineName || record.scheduledVaccine?.label || 'Unknown';
const getDate = ({ date }) => (date ? <DateDisplay date={date} /> : 'Unknown');
const getGiver = record => {
  if (record.status === VACCINE_STATUS.NOT_GIVEN) {
    return (
      <StatusTag $background="#4444441a" $color={Colors.darkestText}>
        Not given
      </StatusTag>
    );
  }
  if (record.givenElsewhere) {
    return 'Given elsewhere';
  }
  return record.givenBy || 'Unknown';
};
const getFacility = record => {
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

const getActionButtons = ({ onItemClick, onItemEditClick, onItemDeleteClick }) => record => {
  return (
    <ActionButtonsContainer>
      <OutlinedButton onClick={() => onItemClick(record)}>
        <TranslatedText stringId="general.actions.view" fallback="View" />
      </OutlinedButton>
      <MarginedMenuButton
        iconColor={Colors.primary}
        actions={{
          Edit: () => onItemEditClick(record),
          Delete: () => onItemDeleteClick(record),
        }}
      />
    </ActionButtonsContainer>
  );
};

const TableHeaderCheckbox = styled(CheckInput)`
  color: ${Colors.darkText};
  label {
    display: flex;
    align-items: center;
  }
  .MuiTypography-root {
    font-size: 11px;
    line-height: 15px;
  }
  .MuiButtonBase-root {
    padding: 0 6px;
  }
`;

export const ImmunisationsTable = React.memo(
  ({ patient, onItemClick, onItemEditClick, onItemDeleteClick, viewOnly, disablePagination }) => {
    const [includeNotGiven, setIncludeNotGiven] = useState(false);

    const notGivenCheckBox = (
      <TableHeaderCheckbox
        label={
          <TranslatedText
            stringId="table.vaccines.notGivenCheckbox"
            fallback="Include vaccines not given"
          />
        }
        value={includeNotGiven}
        onClick={() => setIncludeNotGiven(!includeNotGiven)}
      />
    );

    const COLUMNS = useMemo(
      () => [
        {
          key: 'vaccineDisplayName',
          title: <TranslatedText stringId="table.vaccines.column.vaccine" fallback="Vaccine" />,
          accessor: getVaccineName,
        },
        {
          key: 'schedule',
          title: <TranslatedText stringId="table.vaccines.column.schedule" fallback="Schedule" />,
          accessor: getSchedule,
          sortable: false,
        },
        {
          key: 'date',
          title: <TranslatedText stringId="table.vaccines.column.date" fallback="Date" />,
          accessor: getDate,
        },
        {
          key: 'givenBy',
          title: <TranslatedText stringId="table.vaccines.column.givenBy" fallback="Given by" />,
          accessor: getGiver,
          sortable: false,
        },
        {
          key: 'displayLocation',
          title: (
            <TranslatedText
              stringId="table.vaccines.column.facilityCountry"
              fallback="Facility/Country"
            />
          ),
          accessor: getFacility,
        },
        ...(!viewOnly
          ? [
              {
                key: 'action',
                title: <TranslatedText stringId="table.vaccines.column.action" fallback="Action" />,
                accessor: getActionButtons({ onItemClick, onItemEditClick, onItemDeleteClick }),
                sortable: false,
                isExportable: false,
              },
            ]
          : []),
      ],
      [onItemClick, onItemEditClick, onItemDeleteClick, viewOnly],
    );

    return (
      <DataFetchingTable
        endpoint={`patient/${patient.id}/administeredVaccines`}
        initialSort={{ orderBy: 'date', order: 'desc' }}
        fetchOptions={{ includeNotGiven }}
        columns={COLUMNS}
        noDataMessage="No vaccinations found"
        allowExport={!viewOnly}
        optionRow={!viewOnly && notGivenCheckBox}
        disablePagination={disablePagination}
      />
    );
  },
);
