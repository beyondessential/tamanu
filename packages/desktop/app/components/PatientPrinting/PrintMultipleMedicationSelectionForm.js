import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';

import { Table } from '../Table';
import {
  CheckInput,
  TextInput,
  SelectInput,
  AutocompleteInput,
  OuterLabelFieldWrapper,
} from '../Field';
import { ConfirmCancelRow } from '../ButtonRow';
import { DateDisplay } from '../DateDisplay';
import { MultiplePrescriptionPrintoutModal } from './MultiplePrescriptionPrintoutModal';
import { useApi, useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { Colors } from '../../constants';

const REPEAT_OPTIONS = [
  { label: 0, value: 0 },
  { label: 1, value: 1 },
  { label: 2, value: 2 },
  { label: 3, value: 3 },
  { label: 4, value: 4 },
  { label: 5, value: 5 },
];

const COLUMN_KEYS = {
  SELECTED: 'selected',
  DATE: 'date',
  MEDICATION: 'medication',
  QUANTITY: 'quantity',
  REPEATS: 'repeats',
};

const COLUMNS = [
  {
    key: COLUMN_KEYS.SELECTED,
    title: '',
    sortable: false,
    titleAccessor: ({ onChange, selected }) => (
      <CheckInput value={selected} name="selected" onChange={onChange} />
    ),
    accessor: ({ onChange, selected }) => (
      <CheckInput value={selected} name="selected" onChange={onChange} />
    ),
  },
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
      <SelectInput options={REPEAT_OPTIONS} value={repeats} onChange={onChange} />
    ),
  },
];

const PrescriberWrapper = styled.div`
  width: 200px;
  margin-bottom: 20px;
`;

export const PrintMultipleMedicationSelectionForm = React.memo(({ encounter, onClose }) => {
  const [openPrintoutModal, setOpenPrintoutModal] = useState(false);
  const [titleData, setTitleData] = useState({});
  const [medicationData, setMedicationData] = useState([]);
  const [prescriberId, setPrescriberId] = useState(null);
  const [selectedMedicationData, setSelectedMedicationData] = useState([]);
  const api = useApi();
  const practitionerSuggester = useSuggester('practitioner');
  const { data, error, isLoading } = useQuery(['encounterMedication', encounter.id], () =>
    api.get(`encounter/${encounter.id}/medications`),
  );
  const { currentUser } = useAuth();

  useEffect(() => {
    const medications = data?.data || [];
    const newMedications = medications.map(m => ({ ...m, repeats: 0 }));
    setMedicationData(newMedications);
  }, [data]);

  useEffect(() => {
    setPrescriberId(currentUser.id);
  }, [currentUser]);

  const cellOnChange = useCallback(
    (event, key, rowIndex) => {
      const newMedicationData = [...medicationData];
      if (key === COLUMN_KEYS.SELECTED) {
        newMedicationData[rowIndex][key] = event.target.checked;

        if (!event.target.checked) {
          setTitleData({ selected: false });
        }
      }
      if ([COLUMN_KEYS.QUANTITY, COLUMN_KEYS.REPEATS].includes(key)) {
        newMedicationData[rowIndex][key] = event.target.value;
      }

      const newSelectedMedicationData = newMedicationData.filter(m => m.selected);

      if (newSelectedMedicationData.length === newMedicationData.length) {
        setTitleData({ selected: true });
      }

      setSelectedMedicationData(newSelectedMedicationData);
    },
    [medicationData],
  );

  const headerOnChange = useCallback(
    (event, key) => {
      if (key === COLUMN_KEYS.SELECTED) {
        const newMedicationData = medicationData.map(m => ({
          ...m,
          selected: event.target.checked,
        }));

        setTitleData({ selected: event.target.checked });
        setMedicationData(newMedicationData);
        const newSelectedMedicationData = newMedicationData.filter(m => m.selected);
        setSelectedMedicationData(newSelectedMedicationData);
      }
    },
    [medicationData],
  );

  const handlePrintConfirm = useCallback(() => {
    if (selectedMedicationData.length > 0) {
      setOpenPrintoutModal(true);
    }
  }, [selectedMedicationData]);

  return (
    <>
      <MultiplePrescriptionPrintoutModal
        encounter={encounter}
        prescriberId={prescriberId}
        prescriptions={selectedMedicationData}
        open={openPrintoutModal}
        onClose={() => setOpenPrintoutModal(false)}
      />

      <PrescriberWrapper>
        <AutocompleteInput
          info="The prescriber will appear on the printed prescription"
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
          columns={COLUMNS}
          titleData={titleData}
          data={medicationData || []}
          elevated={false}
          isLoading={isLoading}
          errorMessage={error?.message}
          noDataMessage="No medication requests found"
          allowExport={false}
          cellOnChange={cellOnChange}
          headerOnChange={headerOnChange}
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
