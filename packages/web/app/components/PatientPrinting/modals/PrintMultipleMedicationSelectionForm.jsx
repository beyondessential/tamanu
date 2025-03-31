import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';

import { Table, useSelectableColumn } from '../../Table';
import {
  AutocompleteInput,
  OuterLabelFieldWrapper,
  SelectInput,
  TextField,
  TextInput,
} from '../../Field';
import { ConfirmCancelRow } from '../../ButtonRow';
import { DateDisplay } from '../../DateDisplay';
import { useApi, useSuggester } from '../../../api';
import { useAuth } from '../../../contexts/Auth';
import { MAX_AGE_TO_RECORD_WEIGHT, Colors } from '../../../constants';

import { MultiplePrescriptionPrintoutModal } from './MultiplePrescriptionPrintoutModal';
import { TranslatedText, TranslatedReferenceData } from '../../Translation';
import { useTranslation } from '../../../contexts/Translation';
import { useSelector } from 'react-redux';
import { getAgeDurationFromDate } from '@tamanu/utils/date';

const REPEAT_OPTIONS = [0, 1, 2, 3, 4, 5].map(n => ({ label: n, value: n }));

const COLUMN_KEYS = {
  SELECTED: 'selected',
  DATE: 'date',
  MEDICATION: 'medication',
  QUANTITY: 'quantity',
  REPEATS: 'repeats',
};

const COLUMNS = [
  {
    key: COLUMN_KEYS.DATE,
    title: <TranslatedText
      stringId="general.date.label"
      fallback="Date"
      data-testid='translatedtext-ogsc' />,
    sortable: false,
    accessor: ({ date }) => <DateDisplay date={date} data-testid='datedisplay-nz7u' />,
  },
  {
    key: COLUMN_KEYS.MEDICATION,
    title: <TranslatedText
      stringId="medication.medication.label"
      fallback="Medication"
      data-testid='translatedtext-2y49' />,
    sortable: false,
    maxWidth: 300,
    accessor: ({ medication }) => (
      <TranslatedReferenceData
        fallback={medication.name}
        value={medication.id}
        category={medication.type}
        data-testid='translatedreferencedata-918x' />
    ),
  },
  {
    key: COLUMN_KEYS.QUANTITY,
    title: (
      <TranslatedText
        stringId="medication.modal.printMultiple.table.column.quantity"
        fallback="Quantity"
        data-testid='translatedtext-eb9j' />
    ),
    sortable: false,
    maxWidth: 70,
    accessor: ({ quantity, onChange }) => (
      <TextInput
        type="number"
        InputProps={{
          inputProps: {
            min: 0,
          },
        }}
        value={quantity}
        onChange={onChange}
      />
    ),
  },
  {
    key: COLUMN_KEYS.REPEATS,
    title: (
      <TranslatedText
        stringId="medication.modal.printMultiple.table.column.repeats"
        fallback="Repeats"
        data-testid='translatedtext-1rdv' />
    ),
    sortable: false,
    accessor: ({ repeats, onChange }) => (
      <SelectInput options={REPEAT_OPTIONS} value={repeats} onChange={onChange} required />
    ),
  },
];

const PrescriberWrapper = styled.div`
  width: 100%;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;

  .react-autosuggest__container,
  .patient-weight-input {
    width: 270px;
  }
`;

export const PrintMultipleMedicationSelectionForm = React.memo(({ encounter, onClose }) => {
  const { getTranslation } = useTranslation();
  const weightUnit = getTranslation('general.localisedField.weightUnit.label', 'kg');
  const [openPrintoutModal, setOpenPrintoutModal] = useState(false);
  const [medicationData, setMedicationData] = useState([]);
  const [prescriberId, setPrescriberId] = useState(null);
  const [patientWeight, setPatientWeight] = useState('');
  const prescriberSelected = Boolean(prescriberId);
  const api = useApi();
  const practitionerSuggester = useSuggester('practitioner');
  const { data, error, isLoading } = useQuery(['encounterMedication', encounter.id], () =>
    api.get(`encounter/${encounter.id}/medications`),
  );
  const { currentUser } = useAuth();

  const { selectedRows, selectableColumn } = useSelectableColumn(medicationData, {
    columnKey: COLUMN_KEYS.SELECTED,
  });

  const patient = useSelector(state => state.patient);
  const age = getAgeDurationFromDate(patient.dateOfBirth).years;
  const showPatientWeight = age < MAX_AGE_TO_RECORD_WEIGHT;

  useEffect(() => {
    const medications = data?.data || [];
    const newMedications = medications
      .filter(m => !m.discontinued)
      .map(m => ({ ...m, repeats: 0 }));
    setMedicationData(newMedications);
  }, [data]);

  useEffect(() => {
    setPrescriberId(currentUser.id);
  }, [currentUser]);

  const cellOnChange = useCallback(
    (event, key, rowIndex) => {
      if ([COLUMN_KEYS.QUANTITY, COLUMN_KEYS.REPEATS].includes(key)) {
        const newMedicationData = [...medicationData];
        newMedicationData[rowIndex] = {
          ...newMedicationData[rowIndex],
          [key]: event.target.value,
        };
        setMedicationData(newMedicationData);
      }
    },
    [medicationData],
  );

  const handlePrintConfirm = useCallback(() => {
    if (selectedRows.length > 0 && prescriberSelected) {
      setOpenPrintoutModal(true);
    }
  }, [prescriberSelected, selectedRows]);

  return (
    <>
      <MultiplePrescriptionPrintoutModal
        encounter={encounter}
        prescriberId={prescriberId}
        prescriptions={selectedRows}
        open={openPrintoutModal}
        onClose={() => setOpenPrintoutModal(false)}
        patientWeight={showPatientWeight ? patientWeight : undefined}
      />
      <PrescriberWrapper>
        <AutocompleteInput
          infoTooltip={
            <TranslatedText
              stringId="medication.modal.printMultiple.prescriber.tooltip"
              fallback="The prescriber will appear on the printed prescription"
              data-testid='translatedtext-9q77' />
          }
          name="prescriberId"
          label={<TranslatedText
            stringId="medication.prescriber.label"
            fallback="Prescriber"
            data-testid='translatedtext-ooep' />}
          suggester={practitionerSuggester}
          onChange={event => setPrescriberId(event.target.value)}
          value={currentUser.id}
          required
          error={!prescriberSelected}
          helperText={
            !prescriberSelected && (
              <TranslatedText
                stringId="medication.modal.printMultiple.prescriber.helperText"
                fallback="Please select a prescriber"
                data-testid='translatedtext-sfyh' />
            )
          }
        />
        {showPatientWeight && (
          <TextField
            field={{
              name: 'patientWeight',
              value: patientWeight,
              onChange: e => setPatientWeight(e.target.value),
            }}
            label={
              <TranslatedText
                stringId="medication.patientWeight.label"
                fallback="Patient weight :unit"
                replacements={{ unit: `(${weightUnit})` }}
                data-testid='translatedtext-16m2' />
            }
            placeholder={getTranslation('medication.patientWeight.placeholder', 'e.g 2.4')}
            className="patient-weight-input"
            type="number"
            data-testid='textfield-mtrd' />
        )}
      </PrescriberWrapper>
      <OuterLabelFieldWrapper
        label={
          <TranslatedText
            stringId="medication.modal.printMultiple.table.title"
            fallback="Select the prescriptions you would like to print"
            data-testid='translatedtext-jkgf' />
        }
      >
        <Table
          headerColor={Colors.white}
          columns={[selectableColumn, ...COLUMNS]}
          data={medicationData || []}
          elevated={false}
          isLoading={isLoading}
          errorMessage={error?.message}
          noDataMessage={
            <TranslatedText
              stringId="medication.modal.printMultiple.table.noData"
              fallback="No medication requests found"
              data-testid='translatedtext-qqvh' />
          }
          allowExport={false}
          cellOnChange={cellOnChange}
        />
      </OuterLabelFieldWrapper>
      <ConfirmCancelRow
        cancelText={<TranslatedText
          stringId="general.action.close"
          fallback="Close"
          data-testid='translatedtext-neu6' />}
        confirmText={<TranslatedText
          stringId="general.action.print"
          fallback="Print"
          data-testid='translatedtext-lc3m' />}
        onConfirm={handlePrintConfirm}
        onCancel={onClose}
      />
    </>
  );
});

PrintMultipleMedicationSelectionForm.propTypes = {
  encounter: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};
