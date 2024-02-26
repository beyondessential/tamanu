import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { TranslatedText, CheckInput, DataFetchingTable } from '../../components';
import { Colors } from '../../constants';
import {
  getSchedule,
  getVaccineName,
  getDate,
  getGiver,
  getFacility,
  getActionButtons,
} from './accessors';

const OptionRow = styled.div`
  border-bottom: 1px solid ${Colors.outline};
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  font-size: 0.85rem;
  padding: 0.7rem;
`;

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

const TableHeader = ({ includeNotGiven, setIncludeNotGiven }) => {
  return (
    <OptionRow>
      <TableHeaderCheckbox
        label={
          <TranslatedText
            stringId="vaccine.table.notGivenCheckbox.label"
            fallback="Include vaccines not given"
          />
        }
        value={includeNotGiven}
        onClick={() => setIncludeNotGiven(!includeNotGiven)}
      />
    </OptionRow>
  );
};

export const ImmunisationsTable = React.memo(
  ({ patient, onItemClick, onItemEditClick, onItemDeleteClick, viewOnly, disablePagination }) => {
    const [includeNotGiven, setIncludeNotGiven] = useState(false);

    const COLUMNS = useMemo(
      () => [
        {
          key: 'vaccineDisplayName',
          title: <TranslatedText stringId="vaccine.table.column.vaccine" fallback="Vaccine" />,
          accessor: getVaccineName,
        },
        {
          key: 'schedule',
          title: <TranslatedText stringId="vaccine.table.column.schedule" fallback="Schedule" />,
          accessor: getSchedule,
          sortable: false,
        },
        {
          key: 'date',
          title: <TranslatedText stringId="vaccine.table.column.date" fallback="Date" />,
          accessor: getDate,
        },
        {
          key: 'givenBy',
          title: <TranslatedText stringId="vaccine.table.column.givenBy" fallback="Given by" />,
          accessor: getGiver,
          sortable: false,
        },
        {
          key: 'displayLocation',
          title: (
            <TranslatedText
              stringId="vaccine.table.column.facilityCountry"
              fallback="Facility/Country"
            />
          ),
          accessor: getFacility,
        },
        ...(!viewOnly
          ? [
              {
                key: 'action',
                title: <TranslatedText stringId="vaccine.table.column.action" fallback="Action" />,
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
        noDataMessage={
          <TranslatedText stringId="vaccine.table.noDataMessage" fallback="No vaccinations found" />
        }
        allowExport={!viewOnly}
        TableHeader={
          !viewOnly && (
            <TableHeader
              includeNotGiven={includeNotGiven}
              setIncludeNotGiven={setIncludeNotGiven}
            />
          )
        }
        disablePagination={disablePagination}
      />
    );
  },
);
