import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { CheckInput, DataFetchingTable, Heading4 } from '../../components';
import { getActionButtons, getDate, getFacility, getGiver, getVaccineName } from './accessors';

const Container = styled.div`
  padding: 0.9rem 1.2rem 0.8rem;
  border-bottom: 1px solid ${Colors.outline};
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const Title = styled(Heading4)`
  margin: 0;
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
    <Container>
      <Title>
        <TranslatedText stringId="vaccine.table.recorded.label" fallback="Recorded vaccines" />
      </Title>
      <TableHeaderCheckbox
        label={
          <TranslatedText
            stringId="vaccine.table.notGivenCheckbox.label"
            fallback="Include vaccines not given"
          />
        }
        value={includeNotGiven}
        onClick={() => setIncludeNotGiven(!includeNotGiven)}
        data-testid="notgivencheckbox-mz3p"
      />
    </Container>
  );
};

const getSchedule = ({ scheduledVaccine }) => scheduledVaccine.doseLabel;

export const ImmunisationsTable = React.memo(
  ({ patient, onItemClick, onItemEditClick, onItemDeleteClick, viewOnly, disablePagination, 'data-testid': dataTestId}) => {
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
          title: <TranslatedText stringId="general.date.label" fallback="Date" />,
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
        data-testid={dataTestId}
      />
    );
  },
);
