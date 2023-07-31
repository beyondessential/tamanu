import React from 'react';
import styled from 'styled-components';

import { Colors } from '../../../constants';
import { ContentPane } from '../../../components/ContentPane';
import { DateDisplay } from '../../../components/DateDisplay';
import { OuterLabelFieldWrapper } from '../../../components/Field/OuterLabelFieldWrapper';
import { DataFetchingTable, Table } from '../../../components/Table';

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
    title: 'Item/Prescription',
    accessor: getMedicationNameAndPrescription,
    sortable: true,
  },
  { key: 'quantity', title: 'Qty', sortable: false },
  {
    key: 'prescriber',
    title: 'Clinician',
    accessor: data => data?.prescriber?.displayName ?? '',
    sortable: false,
  },
  {
    key: 'location.facility.name',
    title: 'Facility',
    accessor: data => data?.encounter?.location?.facility?.name ?? '',
    sortable: false,
  },
  {
    key: 'endDate',
    title: 'Discharge date',
    accessor: data => <DateDisplay date={data?.encounter?.endDate ?? ''} />,
    sortable: true,
  },
];

// Presumably it will need different keys and accessors
// and also date column title is different
const DISPENSED_MEDICATION_COLUMNS = [
  { key: 'a', title: 'Item/Prescription', sortable: true },
  { key: 'b', title: 'Qty', sortable: false },
  { key: 'c', title: 'Clinician', sortable: false },
  { key: 'd', title: 'Facility', sortable: false },
  {
    key: 'e',
    title: 'Dispensed date',
    sortable: true,
  },
];

export const PatientMedicationPane = React.memo(({ patient }) => (
  <>
    <ContentPane>
      <OuterLabelFieldWrapper label="Most recent discharge medications">
        <DataFetchingTable
          endpoint={`patient/${patient.id}/lastDischargedEncounter/medications`}
          columns={DISCHARGED_MEDICATION_COLUMNS}
          noDataMessage="No discharge medications found"
          initialSort={{ order: 'desc', orderBy: 'endDate' }}
        />
      </OuterLabelFieldWrapper>
    </ContentPane>
    <ContentPane>
      <OuterLabelFieldWrapper label="Dispensed medications">
        <Table
          columns={DISPENSED_MEDICATION_COLUMNS}
          data={[]}
          noDataMessage="No dispensed medications found"
          // Next two props are used only to avoid a display error and an execution error
          page={0}
          onChangeOrderBy={() => {}}
        />
      </OuterLabelFieldWrapper>
    </ContentPane>
  </>
));
