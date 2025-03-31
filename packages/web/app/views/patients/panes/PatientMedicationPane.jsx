import React from 'react';
import styled from 'styled-components';

import { Colors } from '../../../constants';
import { ContentPane } from '../../../components/ContentPane';
import { DateDisplay } from '../../../components/DateDisplay';
import { OuterLabelFieldWrapper } from '../../../components/Field/OuterLabelFieldWrapper';
import { DataFetchingTable, Table } from '../../../components/Table';
import { TranslatedText, TranslatedReferenceData } from '../../../components/Translation';

const StyledDiv = styled.div`
  max-width: 20vw;
`;

const StyledTextSpan = styled.span`
  color: ${props => (props.color ? props.color : Colors.darkText)};
`;

const getMedicationNameAndPrescription = ({ medication, prescription }) => (
  <StyledDiv>
    <StyledTextSpan>
      <TranslatedReferenceData
        fallback={medication.name}
        value={medication.id}
        category="drug"
        data-test-id='translatedreferencedata-kohv' />
    </StyledTextSpan>
    <br />
    <StyledTextSpan color={Colors.midText}>{prescription}</StyledTextSpan>
  </StyledDiv>
);

const DISCHARGED_MEDICATION_COLUMNS = [
  {
    key: 'Medication.name',
    title: (
      <TranslatedText
        stringId="patient.medication.table.column.itemOrPrescription"
        fallback="Item/Prescription"
        data-test-id='translatedtext-ses1' />
    ),
    accessor: getMedicationNameAndPrescription,
    sortable: true,
  },
  {
    key: 'quantity',
    title: <TranslatedText
      stringId="patient.medication.table.column.quantity"
      fallback="Qty"
      data-test-id='translatedtext-3vgw' />,
    sortable: false,
  },
  {
    key: 'prescriber',
    title: (
      <TranslatedText
        stringId="general.localisedField.clinician.label"
        fallback="Clinician"
        data-test-id='translatedtext-hmtc' />
    ),
    accessor: data => data?.prescriber?.displayName ?? '',
    sortable: false,
  },
  {
    key: 'location.facility.name',
    title: <TranslatedText
      stringId="general.localisedField.facility.label"
      fallback="Facility"
      data-test-id='translatedtext-a78c' />,
    accessor: data => data?.encounter?.location?.facility?.name
      ? <TranslatedReferenceData
      fallback={data?.encounter?.location?.facility.name}
      value={data?.encounter?.location?.facility.id}
      category="facility"
      data-test-id='translatedreferencedata-q09w' />
      : '',
    sortable: false,
  },
  {
    key: 'endDate',
    title: (
      <TranslatedText
        stringId="patient.medication.table.column.endDate"
        fallback="Discharge date"
        data-test-id='translatedtext-sdas' />
    ),
    accessor: data => <DateDisplay date={data?.encounter?.endDate ?? ''} data-test-id='datedisplay-edvg' />,
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
        stringId="patient.medication.table.column.itemOrPrescription"
        fallback="Item/Prescription"
        data-test-id='translatedtext-8ft7' />
    ),
    sortable: true,
  },
  {
    key: 'b',
    title: <TranslatedText
      stringId="patient.medication.table.column.quantity"
      fallback="Qty"
      data-test-id='translatedtext-28dz' />,
    sortable: false,
  },
  {
    key: 'c',
    title: (
      <TranslatedText
        stringId="general.localisedField.clinician.label"
        fallback="Clinician"
        data-test-id='translatedtext-nkgh' />
    ),
    sortable: false,
  },
  {
    key: 'd',
    title: <TranslatedText
      stringId="general.localisedField.facility.label"
      fallback="Facility"
      data-test-id='translatedtext-nvzk' />,
    sortable: false,
  },
  {
    key: 'e',
    title: (
      <TranslatedText
        stringId="patient.medication.table.column.dispensedDate"
        fallback="Dispensed date"
        data-test-id='translatedtext-os13' />
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
            data-test-id='translatedtext-kj2u' />
        }
      >
        <DataFetchingTable
          endpoint={`patient/${patient.id}/lastDischargedEncounter/medications`}
          columns={DISCHARGED_MEDICATION_COLUMNS}
          noDataMessage={
            <TranslatedText
              stringId="patient.medication.discharge.table.noData"
              fallback="No discharge medications found"
              data-test-id='translatedtext-xubp' />
          }
          initialSort={{ order: 'desc', orderBy: 'endDate' }}
          data-test-id='datafetchingtable-qrum' />
      </OuterLabelFieldWrapper>
    </ContentPane>
    <ContentPane>
      <OuterLabelFieldWrapper
        label={
          <TranslatedText
            stringId="patient.medication.dispensed.table.title"
            fallback="Dispensed medications"
            data-test-id='translatedtext-7beg' />
        }
      >
        <Table
          columns={DISPENSED_MEDICATION_COLUMNS}
          data={[]}
          noDataMessage={
            <TranslatedText
              stringId="patient.medication.dispensed.table.noData"
              fallback="No dispensed medications found"
              data-test-id='translatedtext-aw8y' />
          }
          // Next two props are used only to avoid a display error and an execution error
          page={0}
          onChangeOrderBy={() => {}}
        />
      </OuterLabelFieldWrapper>
    </ContentPane>
  </>
));
