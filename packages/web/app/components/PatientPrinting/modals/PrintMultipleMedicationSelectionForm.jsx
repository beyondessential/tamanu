import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';

import { Table, useSelectableColumn } from '../../Table';
import { AutocompleteInput, OuterLabelFieldWrapper, SelectInput, TextInput } from '../../Field';
import { ConfirmCancelRow } from '../../ButtonRow';
import { DateDisplay } from '../../DateDisplay';
import { useApi, useSuggester } from '../../../api';
import { useAuth } from '../../../contexts/Auth';
import { Colors } from '../../../constants';

import { MultiplePrescriptionPrintoutModal } from './MultiplePrescriptionPrintoutModal';
import { TranslatedText } from '../../Translation/TranslatedText';

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
    title: <TranslatedText stringId="general.table.column.date" fallback="Date" />,
    sortable: false,
    accessor: ({ date }) => <DateDisplay date={date} />,
  },
  {
    key: COLUMN_KEYS.MEDICATION,
    title: (
      <TranslatedText
        stringId="medication.modal.printMultiple.table.column.medication"
        fallback="Medication"
      />
    ),
    sortable: false,
    maxWidth: 300,
    accessor: ({ medication }) => medication.name,
  },
  {
    key: COLUMN_KEYS.QUANTITY,
    title: (
      <TranslatedText
        stringId="medication.modal.printMultiple.table.column.quantity"
        fallback="Quantity"
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
      />
    ),
  },
  {
    key: COLUMN_KEYS.REPEATS,
    title: (
      <TranslatedText
        stringId="medication.modal.printMultiple.table.column.repeats"
        fallback="Repeats"
      />
    ),
    sortable: false,
    accessor: ({ repeats, onChange }) => (
      <SelectInput options={REPEAT_OPTIONS} value={repeats} onChange={onChange} required />
    ),
  },
];

const PrescriberWrapper = styled.div`
  width: 200px;
  margin-bottom: 20px;
`;

export const PrintMultipleMedicationSelectionForm = React.memo(({ encounter, onClose }) => {
  const [openPrintoutModal, setOpenPrintoutModal] = useState(false);
  const [medicationData, setMedicationData] = useState([]);
  const [prescriberId, setPrescriberId] = useState(null);
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
      />

      <PrescriberWrapper>
        <AutocompleteInput
          infoTooltip={
            <TranslatedText
              stringId="medication.modal.printMultiple.prescriber.tooltip"
              fallback="The prescriber will appear on the printed prescription"
            />
          }
          name="prescriberId"
          label={
            <TranslatedText
              stringId="medication.modal.printMultiple.form.prescriber.label"
              fallback="Prescriber"
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
              />
            )
          }
        />
      </PrescriberWrapper>

      <OuterLabelFieldWrapper
        label={
          <TranslatedText
            stringId="medication.modal.printMultiple.table.title"
            fallback="Select the prescriptions you would like to print"
          />
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
            />
          }
          allowExport={false}
          cellOnChange={cellOnChange}
        />
      </OuterLabelFieldWrapper>
      <ConfirmCancelRow
        cancelText={<TranslatedText stringId="general.action.close" fallback="Close" />}
        confirmText={<TranslatedText stringId="general.action.print" fallback="Print" />}
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
