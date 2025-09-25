import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';
import { intersectionBy } from 'lodash';
import {
  OuterLabelFieldWrapper,
  TextField,
  TextInput,
  ConfirmCancelRow,
} from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { Table, useSelectableColumn } from '../../Table';
import { AutocompleteInput, NumberInput } from '../../Field';
import { DateDisplay } from '../../DateDisplay';
import { useApi, useSuggester } from '../../../api';
import { useAuth } from '../../../contexts/Auth';
import { MAX_AGE_TO_RECORD_WEIGHT } from '../../../constants';

import { MultiplePrescriptionPrintoutModal } from './MultiplePrescriptionPrintoutModal';
import { TranslatedText, TranslatedReferenceData } from '../../Translation';
import { useTranslation } from '../../../contexts/Translation';
import { useSelector } from 'react-redux';
import { getAgeDurationFromDate } from '@tamanu/utils/date';

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
    title: (
      <TranslatedText
        stringId="general.date.label"
        fallback="Date"
        data-testid="translatedtext-xv2x"
      />
    ),
    sortable: false,
    accessor: ({ date }) => <DateDisplay date={date} data-testid="datedisplay-zo5j" />,
  },
  {
    key: COLUMN_KEYS.MEDICATION,
    title: (
      <TranslatedText
        stringId="medication.medication.label"
        fallback="Medication"
        data-testid="translatedtext-fmmr"
      />
    ),
    sortable: false,
    maxWidth: 300,
    accessor: ({ medication }) => (
      <TranslatedReferenceData
        fallback={medication.name}
        value={medication.id}
        category={medication.type}
        data-testid="translatedreferencedata-sv6j"
      />
    ),
  },
  {
    key: COLUMN_KEYS.QUANTITY,
    title: (
      <TranslatedText
        stringId="medication.modal.printMultiple.table.column.quantity"
        fallback="Quantity"
        data-testid="translatedtext-3j93"
      />
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
        data-testid="textinput-rxbh"
      />
    ),
  },
  {
    key: COLUMN_KEYS.REPEATS,
    title: (
      <TranslatedText
        stringId="medication.modal.printMultiple.table.column.repeats"
        fallback="Repeats"
        data-testid="translatedtext-psdf"
      />
    ),
    sortable: false,
    accessor: ({ repeats, onChange }) => (
      <Box width="89px">
        <NumberInput value={repeats} onChange={onChange} required data-testid="selectinput-ld3p" />
      </Box>
    ),
  },
];

const PrescriberWrapper = styled.div`
  width: 100%;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;

  .react-autosuggest__container,
  .patient-weight-input {
    width: 270px;
  }
`;

const StyledTable = styled(Table)`
  .MuiTableCell-root {
    &.MuiTableCell-head {
      height: 50px;
    }
    height: 65px;
    padding: 0 15px;
  }
  .MuiTableRow-root {
    &:last-child {
      .MuiTableCell-body {
        border-bottom: none;
      }
    }
  }
`;

const HorizontalDivider = styled(Divider)`
  margin: 30px 0;
`;

export const PrintMultipleMedicationSelectionForm = React.memo(({ encounter, onClose }) => {
  const { ability, currentUser } = useAuth();
  const { getTranslation } = useTranslation();
  const weightUnit = getTranslation('general.localisedField.weightUnit.label', 'kg');
  const [openPrintoutModal, setOpenPrintoutModal] = useState(false);

  const [prescriberId, setPrescriberId] = useState(null);
  const [patientWeight, setPatientWeight] = useState('');
  const prescriberSelected = Boolean(prescriberId);
  const api = useApi();
  const practitionerSuggester = useSuggester('practitioner');
  const { data, error, isLoading } = useQuery(['encounterMedication', encounter.id], () =>
    api.get(`encounter/${encounter.id}/medications`),
  );

  const canWriteSensitiveMedication = ability.can('write', 'SensitiveMedication');
  const defaultMedicationData = useMemo(
    () =>
      data?.data.filter(m => {
        const isSensitive = m.medication?.referenceDrug?.isSensitive;
        return !m.discontinued && (!isSensitive || canWriteSensitiveMedication);
      }) || [],
    [data, canWriteSensitiveMedication],
  );
  const [medicationData, setMedicationData] = useState(defaultMedicationData);

  useEffect(() => {
    setMedicationData(defaultMedicationData);
  }, [defaultMedicationData]);

  const { selectedRows, selectableColumn } = useSelectableColumn(defaultMedicationData, {
    columnKey: COLUMN_KEYS.SELECTED,
    selectAllOnInit: true,
  });

  const patient = useSelector(state => state.patient);
  const age = getAgeDurationFromDate(patient.dateOfBirth)?.years ?? 0;
  const showPatientWeight = age < MAX_AGE_TO_RECORD_WEIGHT;

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
        prescriptions={intersectionBy(medicationData, selectedRows, 'id')}
        open={openPrintoutModal}
        onClose={() => setOpenPrintoutModal(false)}
        patientWeight={showPatientWeight ? patientWeight : undefined}
        data-testid="multipleprescriptionprintoutmodal-axek"
      />
      <PrescriberWrapper data-testid="prescriberwrapper-r57g">
        <AutocompleteInput
          infoTooltip={
            <Box width="147px">
              <TranslatedText
                stringId="medication.modal.printMultiple.prescriber.tooltip"
                fallback="The prescriber will appear on the printed prescription"
                data-testid="translatedtext-s7yn"
              />
            </Box>
          }
          name="prescriberId"
          label={
            <TranslatedText
              stringId="medication.prescriber.label"
              fallback="Prescriber"
              data-testid="translatedtext-aemx"
            />
          }
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
                data-testid="translatedtext-lart"
              />
            )
          }
          data-testid="autocompleteinput-ampt"
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
                data-testid="translatedtext-m7qh"
              />
            }
            placeholder={getTranslation('medication.patientWeight.placeholder', 'e.g 2.4')}
            className="patient-weight-input"
            type="number"
            data-testid="textfield-iw09"
          />
        )}
      </PrescriberWrapper>
      <OuterLabelFieldWrapper
        label={
          <Box mb="8px">
            <TranslatedText
              stringId="medication.modal.printMultiple.table.title"
              fallback="Select the prescriptions you would like to print"
              data-testid="translatedtext-qydt"
            />
          </Box>
        }
        data-testid="outerlabelfieldwrapper-r5kq"
      >
        <StyledTable
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
              data-testid="translatedtext-mj0s"
            />
          }
          allowExport={false}
          cellOnChange={cellOnChange}
          data-testid="table-3r2b"
        />
      </OuterLabelFieldWrapper>
      <HorizontalDivider color={Colors.outline} />
      <ConfirmCancelRow
        cancelText={
          <TranslatedText
            stringId="general.action.close"
            fallback="Close"
            data-testid="translatedtext-9xde"
          />
        }
        confirmText={
          <TranslatedText
            stringId="medication.action.printPrescription"
            fallback="Print prescription"
            data-testid="translatedtext-ojsa"
          />
        }
        confirmDisabled={!selectedRows.length}
        onConfirm={handlePrintConfirm}
        onCancel={onClose}
        data-testid="confirmcancelrow-9lo1"
      />
    </>
  );
});

PrintMultipleMedicationSelectionForm.propTypes = {
  encounter: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};
