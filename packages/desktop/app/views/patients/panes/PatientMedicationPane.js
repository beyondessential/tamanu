import React from 'react';
import styled from 'styled-components';

import { Colors } from '../../../constants';
import { ContentPane } from '../../../components/ContentPane';
import { DateDisplay } from '../../../components/DateDisplay';
import { OuterLabelFieldWrapper } from '../../../components/Field/OuterLabelFieldWrapper';
import { DataFetchingTable, Table } from '../../../components/Table';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const StyledDiv = styled.div`
  max-width: 20vw;
`;

const StyledTextSpan = styled.span`
  color: ${props => (props.color ? props.color : Colors.darkText)};
`;

const getMedicationNameAndPrescription = ({ medication, prescription }) => (
  <StyledDiv>
    <StyledTextSpan>{medication.name}</StyledTextSpan>
    <br />
    <StyledTextSpan color={Colors.midText}>{prescription}</StyledTextSpan>
  </StyledDiv>
);

const DISCHARGED_MEDICATION_COLUMNS = [
  {
    key: 'Medication.name',
    title: (
      <TranslatedText
        stringId="patient.medication.table.column.medicationName"
        fallback="Item/Prescription"
      />
    ),
    accessor: getMedicationNameAndPrescription,
    sortable: true,
  },
  {
    key: 'quantity',
    title: <TranslatedText stringId="patient.medication.table.column.quantity" fallback="Qty" />,
    sortable: false,
  },
  {
    key: 'prescriber',
    title: (
      <TranslatedText stringId="patient.medication.table.column.prescriber" fallback="Clinician" />
    ),
    accessor: data => data?.prescriber?.displayName ?? '',
    sortable: false,
  },
  {
    key: 'location.facility.name',
    title: (
      <TranslatedText stringId="patient.medication.table.column.facility" fallback="Facility" />
    ),
    accessor: data => data?.encounter?.location?.facility?.name ?? '',
    sortable: false,
  },
  {
    key: 'endDate',
    title: (
      <TranslatedText
        stringId="patient.medication.table.column.endDate"
        fallback="Discharge date"
      />
    ),
    accessor: data => <DateDisplay date={data?.encounter?.endDate ?? ''} />,
    sortable: true,
  },
];

// Presumably it will need different keys and accessors
// and also date column title is different
const DISPENSED_MEDICATION_COLUMNS = [
  {
    key: 'a',
    title: (
      <TranslatedText
        stringId="patient.medication.table.column.medicationName"
        fallback="Item/Prescription"
      />
    ),
    sortable: true,
  },
  {
    key: 'b',
    title: <TranslatedText stringId="patient.medication.table.column.quantity" fallback="Qty" />,
    sortable: false,
  },
  {
    key: 'c',
    title: (
      <TranslatedText stringId="patient.medication.table.column.prescriber" fallback="Clinician" />
    ),
    sortable: false,
  },
  {
    key: 'd',
    title: (
      <TranslatedText stringId="patient.medication.table.column.facility" fallback="Facility" />
    ),
    sortable: false,
  },
  {
    key: 'e',
    title: (
      <TranslatedText
        stringId="patient.medication.table.column.dispenseDate"
        fallback="Dispensed date"
      />
    ),
    sortable: true,
  },
];

export const PatientMedicationPane = React.memo(({ patient }) => (
  <>
    <ContentPane>
      <OuterLabelFieldWrapper
        label={
          <TranslatedText
            stringId="patient.medication.discharge.table.title"
            fallback="Most recent discharge medications"
          />
        }
      >
        <DataFetchingTable
          endpoint={`patient/${patient.id}/lastDischargedEncounter/medications`}
          columns={DISCHARGED_MEDICATION_COLUMNS}
          noDataMessage={
            <TranslatedText
              stringId="patient.medication.discharge.table.noData"
              fallback="No discharge medications found"
            />
          }
          initialSort={{ order: 'desc', orderBy: 'endDate' }}
        />
      </OuterLabelFieldWrapper>
    </ContentPane>
    <ContentPane>
      <OuterLabelFieldWrapper
        label={
          <TranslatedText
            stringId="patient.medication.dispensed.table.title"
            fallback="Dispensed medications"
          />
        }
      >
        <Table
          columns={DISPENSED_MEDICATION_COLUMNS}
          data={[]}
          noDataMessage={
            <TranslatedText
              stringId="patient.medication.dispensed.table.noData"
              fallback="No dispensed medications found"
            />
          }
          // Next two props are used only to avoid a display error and an execution error
          page={0}
          onChangeOrderBy={() => {}}
        />
      </OuterLabelFieldWrapper>
    </ContentPane>
  </>
));
