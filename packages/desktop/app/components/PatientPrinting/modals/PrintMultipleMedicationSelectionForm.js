import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';

import { Table, useSelectableColumn } from '../../Table';
import { TextInput, SelectInput, AutocompleteInput, OuterLabelFieldWrapper } from '../../Field';
import { ConfirmCancelRow } from '../../ButtonRow';
import { DateDisplay } from '../../DateDisplay';
import { useApi, useSuggester } from '../../../api';
import { useAuth } from '../../../contexts/Auth';
import { Colors } from '../../../constants';

import { MultiplePrescriptionPrintoutModal } from './MultiplePrescriptionPrintoutModal';

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
    title: 'Date',
    sortable: false,
    accessor: ({ date }) => <DateDisplay date={date} />,
  },
  {
    key: COLUMN_KEYS.MEDICATION,
    title: 'Medication',
    sortable: false,
    maxWidth: 300,
    accessor: ({ medication }) => medication.name,
  },
  {
    key: COLUMN_KEYS.QUANTITY,
    title: 'Quantity',
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
    title: 'Repeats',
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
    if (selectedRows.length > 0) {
      setOpenPrintoutModal(true);
    }
  }, [selectedRows]);

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
          infoTooltip="The prescriber will appear on the printed prescription"
          name="prescriberId"
          label="Prescriber"
          suggester={practitionerSuggester}
          onChange={event => setPrescriberId(event.target.value)}
          value={currentUser.id}
        />
      </PrescriberWrapper>

      <OuterLabelFieldWrapper label="Select the prescriptions you would like to print">
        <Table
          headerColor={Colors.white}
          columns={[selectableColumn, ...COLUMNS]}
          data={medicationData || []}
          elevated={false}
          isLoading={isLoading}
          errorMessage={error?.message}
          noDataMessage="No medication requests found"
          allowExport={false}
          cellOnChange={cellOnChange}
        />
      </OuterLabelFieldWrapper>
      <ConfirmCancelRow
        cancelText="Close"
        confirmText="Print"
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
