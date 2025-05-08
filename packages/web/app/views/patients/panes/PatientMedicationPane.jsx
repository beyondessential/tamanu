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
  color: ${(props) => (props.color ? props.color : Colors.darkText)};
`;

const getMedicationNameAndPrescription = ({ medication, prescription }) => (
  <StyledDiv data-testid="styleddiv-pluj">
    <StyledTextSpan data-testid="styledtextspan-ygy4">
      <TranslatedReferenceData
        fallback={medication.name}
        value={medication.id}
        category="drug"
        data-testid="translatedreferencedata-vco4"
      />
    </StyledTextSpan>
    <br />
    <StyledTextSpan color={Colors.midText} data-testid="styledtextspan-fde4">
      {prescription}
    </StyledTextSpan>
  </StyledDiv>
);

const DISCHARGED_MEDICATION_COLUMNS = [
  {
    key: 'Medication.name',
    title: (
      <TranslatedText
        stringId="patient.medication.table.column.itemOrPrescription"
        fallback="Item/Prescription"
        data-testid="translatedtext-6eox"
      />
    ),
    accessor: getMedicationNameAndPrescription,
    sortable: true,
  },
  {
    key: 'quantity',
    title: (
      <TranslatedText
        stringId="patient.medication.table.column.quantity"
        fallback="Qty"
        data-testid="translatedtext-l8ko"
      />
    ),
    sortable: false,
  },
  {
    key: 'prescriber',
    title: (
      <TranslatedText
        stringId="general.localisedField.clinician.label"
        fallback="Clinician"
        data-testid="translatedtext-kqqo"
      />
    ),
    accessor: (data) => data?.prescriber?.displayName ?? '',
    sortable: false,
  },
  {
    key: 'location.facility.name',
    title: (
      <TranslatedText
        stringId="general.localisedField.facility.label"
        fallback="Facility"
        data-testid="translatedtext-7hyb"
      />
    ),
    accessor: (data) =>
      data?.encounter?.location?.facility?.name ? (
        <TranslatedReferenceData
          fallback={data?.encounter?.location?.facility.name}
          value={data?.encounter?.location?.facility.id}
          category="facility"
          data-testid="translatedreferencedata-vzpv"
        />
      ) : (
        ''
      ),
    sortable: false,
  },
  {
    key: 'endDate',
    title: (
      <TranslatedText
        stringId="patient.medication.table.column.endDate"
        fallback="Discharge date"
        data-testid="translatedtext-8p47"
      />
    ),
    accessor: (data) => (
      <DateDisplay date={data?.encounter?.endDate ?? ''} data-testid="datedisplay-zvsc" />
    ),
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
        data-testid="translatedtext-g5vl"
      />
    ),
    sortable: true,
  },
  {
    key: 'b',
    title: (
      <TranslatedText
        stringId="patient.medication.table.column.quantity"
        fallback="Qty"
        data-testid="translatedtext-kdu0"
      />
    ),
    sortable: false,
  },
  {
    key: 'c',
    title: (
      <TranslatedText
        stringId="general.localisedField.clinician.label"
        fallback="Clinician"
        data-testid="translatedtext-haxa"
      />
    ),
    sortable: false,
  },
  {
    key: 'd',
    title: (
      <TranslatedText
        stringId="general.localisedField.facility.label"
        fallback="Facility"
        data-testid="translatedtext-2cie"
      />
    ),
    sortable: false,
  },
  {
    key: 'e',
    title: (
      <TranslatedText
        stringId="patient.medication.table.column.dispensedDate"
        fallback="Dispensed date"
        data-testid="translatedtext-mykv"
      />
    ),
    sortable: true,
  },
];

export const PatientMedicationPane = React.memo(({ patient }) => (
  <>
    <ContentPane data-testid="contentpane-yc27">
      <OuterLabelFieldWrapper
        label={
          <TranslatedText
            stringId="patient.medication.discharge.table.title"
            fallback="Most recent discharge medications"
            data-testid="translatedtext-5fcj"
          />
        }
        data-testid="outerlabelfieldwrapper-2t2t"
      >
        <DataFetchingTable
          endpoint={`patient/${patient.id}/lastDischargedEncounter/medications`}
          columns={DISCHARGED_MEDICATION_COLUMNS}
          noDataMessage={
            <TranslatedText
              stringId="patient.medication.discharge.table.noData"
              fallback="No discharge medications found"
              data-testid="translatedtext-3ixn"
            />
          }
          initialSort={{ order: 'desc', orderBy: 'endDate' }}
          data-testid="datafetchingtable-40hh"
        />
      </OuterLabelFieldWrapper>
    </ContentPane>
    <ContentPane data-testid="contentpane-epcl">
      <OuterLabelFieldWrapper
        label={
          <TranslatedText
            stringId="patient.medication.dispensed.table.title"
            fallback="Dispensed medications"
            data-testid="translatedtext-4cn1"
          />
        }
        data-testid="outerlabelfieldwrapper-zdiq"
      >
        <Table
          columns={DISPENSED_MEDICATION_COLUMNS}
          data={[]}
          noDataMessage={
            <TranslatedText
              stringId="patient.medication.dispensed.table.noData"
              fallback="No dispensed medications found"
              data-testid="translatedtext-zv1j"
            />
          }
          // Next two props are used only to avoid a display error and an execution error
          page={0}
          onChangeOrderBy={() => {}}
          data-testid="table-di95"
        />
      </OuterLabelFieldWrapper>
    </ContentPane>
  </>
));
