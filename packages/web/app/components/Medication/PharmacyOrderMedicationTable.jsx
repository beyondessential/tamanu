import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

import { formatShortest } from '@tamanu/utils/dateTime';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';

import { NumberInput, OuterLabelFieldWrapper, TextInput, CheckInput } from '../Field';
import { Colors } from '../../constants';
import { Table } from '../Table';
import { useTranslation } from '../../contexts/Translation';
import { TranslatedText, TranslatedReferenceData } from '../Translation';

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

export const COLUMN_KEYS = {
  SELECT: 'select',
  DATE: 'date',
  MEDICATION: 'medication',
  DOSE: 'dose',
  FREQUENCY: 'frequency',
  QUANTITY: 'quantity',
  REPEATS: 'repeats',
};

const COLUMNS = (getTranslation, getEnumTranslation, onSelectAll, selectAllChecked) => [
  {
    key: COLUMN_KEYS.SELECT,
    title: (
      <CheckInput
        value={selectAllChecked}
        onChange={onSelectAll}
        style={{ margin: 'auto' }}
        data-testid="select-all-checkbox"
      />
    ),
    sortable: false,
    maxWidth: 50,
    accessor: ({ selected, onSelect }) => (
      <CheckInput
        value={selected}
        onChange={onSelect}
        style={{ margin: 'auto' }}
        data-testid="prescription-checkbox"
      />
    ),
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
    key: COLUMN_KEYS.DOSE,
    title: (
      <TranslatedText
        stringId="medication.dose.label"
        fallback="Dose"
        data-testid="translatedtext-dose"
      />
    ),
    sortable: false,
    accessor: ({ doseAmount, units, isVariableDose }) =>
      getMedicationDoseDisplay(
        { doseAmount, units, isVariableDose },
        getTranslation,
        getEnumTranslation,
      ),
  },
  {
    key: COLUMN_KEYS.FREQUENCY,
    title: (
      <TranslatedText
        stringId="medication.frequency.label"
        fallback="Frequency"
        data-testid="translatedtext-frequency"
      />
    ),
    sortable: false,
    accessor: ({ frequency }) =>
      frequency ? getTranslatedFrequency(frequency, getTranslation) : '',
  },
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
    accessor: ({ date }) => formatShortest(date),
  },
  {
    key: COLUMN_KEYS.QUANTITY,
    title: (
      <OuterLabelFieldWrapper
        label={
          <TranslatedText
            stringId="pharmacyOrder.table.column.quantity"
            fallback="Quantity"
            data-testid="translatedtext-3j93"
          />
        }
        required
      />
    ),
    sortable: false,
    maxWidth: 100,
    accessor: ({ quantity, onChange, hasError, selected }) => (
      <TextInput
        type="number"
        InputProps={{
          inputProps: {
            min: 1,
          },
        }}
        value={quantity}
        onChange={onChange}
        required
        error={hasError}
        disabled={!selected}
        data-testid="textinput-rxbh"
      />
    ),
  },
  {
    key: COLUMN_KEYS.REPEATS,
    title: (
      <TranslatedText
        stringId="pharmacyOrder.table.column.repeats"
        fallback="Repeats"
        data-testid="translatedtext-psdf"
      />
    ),
    sortable: false,
    accessor: ({ repeats, onChange, selected }) => (
      <Box width="89px">
        <NumberInput
          value={repeats || ''}
          onChange={onChange}
          InputProps={{
            inputProps: {
              min: 0,
            },
          }}
          disabled={!selected}
          data-testid="selectinput-ld3p"
        />
      </Box>
    ),
  },
];

export const PharmacyOrderMedicationTable = ({
  data,
  error,
  isLoading,
  cellOnChange,
  handleSelectAll,
  selectAllChecked,
}) => {
  const { getTranslation, getEnumTranslation } = useTranslation();
  return (
    <StyledTable
      headerColor={Colors.white}
      columns={COLUMNS(getTranslation, getEnumTranslation, handleSelectAll, selectAllChecked)}
      data={data || []}
      elevated={false}
      isLoading={isLoading}
      errorMessage={error?.message}
      noDataMessage={
        <TranslatedText
          stringId="pharmacyOrder.table.noData"
          fallback="No medications found for this encounter"
          data-testid="translatedtext-mj0s"
        />
      }
      allowExport={false}
      cellOnChange={cellOnChange}
      data-testid="table-3r2b"
    />
  );
};
