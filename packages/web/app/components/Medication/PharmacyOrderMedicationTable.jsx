import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import { TextInput, DateDisplay, TimeDisplay, ThemedTooltip, ConditionalTooltip } from '@tamanu/ui-components';
import { MEDICATION_DURATION_DISPLAY_UNITS_LABELS } from '@tamanu/constants';

import { Colors } from '../../constants/styles';
import { OuterLabelFieldWrapper, CheckInput } from '../Field';
import { Table } from '../Table';
import { useTranslation } from '../../contexts/Translation';
import { TranslatedText, TranslatedReferenceData } from '../Translation';
import { singularize } from '../../utils';

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
  .MuiTableCell-head {
    background-color: ${Colors.white};
    padding-top: 12px;
    padding-bottom: 12px;
    span,
    div {
      font-weight: 400;
    }
    span:not(.required-indicator),
    div {
      color: ${Colors.midText};
    }
    padding-left: 10px;
    padding-right: 10px;
    &:last-child {
      padding-right: 10px;
    }
    &:first-child {
      padding-left: 10px;
    }
  }
  .MuiTableCell-body {
    padding: ${props => (props.$noData ? '10px' : '4px 10px')};
    height: 44px;
    &:last-child {
      padding-right: 10px;
    }
    &:first-child {
      padding-left: 10px;
    }
  }
  .MuiTableBody-root .MuiTableRow-root:not(.statusRow) {
    cursor: ${props => (props.onClickRow ? 'pointer' : '')};
    &:hover {
      background-color: ${Colors.veryLightBlue};
    }
  }
  .MuiTableBody-root {
    .MuiTableRow-root {
      &:last-child {
        td {
          border-bottom: none;
        }
      }
    }
  }
`;

const NoWrapCell = styled(Box)`
  white-space: nowrap;
`;

const TwoLineHeaderText = styled.div`
  width: 85px;
  white-space: normal;
`;

export const COLUMN_KEYS = {
  SELECT: 'select',
  DATE: 'date',
  MEDICATION: 'medication',
  DOSE: 'dose',
  FREQUENCY: 'frequency',
  DURATION: 'duration',
  QUANTITY: 'quantity',
  REPEATS: 'repeats',
  LAST_SENT: 'lastSent',
};

const getColumns = (
  getTranslation,
  getEnumTranslation,
  onSelectAll,
  selectAllChecked,
  columnsToInclude = Object.values(COLUMN_KEYS),
  { isOngoingMode = false, disabledPrescriptionIds = [] } = {},
) => {
  const allColumns = [
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
      accessor: ({ selected, onSelect, id }) => {
        const isDisabled = isOngoingMode && disabledPrescriptionIds.includes(id);
        return (
          <ConditionalTooltip
            visible={isDisabled}
            title={
              <Box width="122px">
                <TranslatedText
                  stringId="medication.sendToPharmacy.noRepeatsRemaining"
                  fallback="Only medications with repeats greater than 0 can be sent to pharmacy"
                />
              </Box>
            }
          >
            <span>
              <CheckInput
                value={selected}
                onChange={onSelect}
                disabled={isDisabled}
                style={{ margin: 'auto' }}
                data-testid="prescription-checkbox"
              />
            </span>
          </ConditionalTooltip>
        );
      },
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
      key: COLUMN_KEYS.DURATION,
      title: (
        <TranslatedText
          stringId="medication.details.duration"
          fallback="Duration"
          data-testid="translatedtext-duration"
        />
      ),
      sortable: false,
      accessor: ({ durationValue, durationUnit }) => {
        if (!durationValue || !durationUnit) {
          return '-';
        }

        const unitLabel = getEnumTranslation(
          MEDICATION_DURATION_DISPLAY_UNITS_LABELS,
          durationUnit,
        );

        return `${durationValue} ${singularize(unitLabel, durationValue).toLowerCase()}`;
      },
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
      accessor: ({ date }) => <DateDisplay date={date} format="shortest" />,
    },
    {
      key: COLUMN_KEYS.LAST_SENT,
      title: <TranslatedText stringId="medication.table.column.lastSent" fallback="Last sent" />,
      sortable: false,
      accessor: ({ lastOrderedAt }) => {
        if (!lastOrderedAt) {
          return (
            <NoWrapCell color={'inherit'} fontStyle={'normal'}>
              <TranslatedText
                stringId="general.fallback.notApplicable"
                fallback="N/A"
                casing="lower"
                data-testid="translatedtext-nc3a"
              />
            </NoWrapCell>
          );
        }

        return (
          <NoWrapCell color={'inherit'} fontStyle={'normal'}>
            <Box>
              <DateDisplay date={lastOrderedAt} format="shortest" />
              <Box fontSize="12px" color={Colors.softText}>
                <TimeDisplay date={lastOrderedAt} format="compact" />
              </Box>
            </Box>
          </NoWrapCell>
        );
      },
    },
    {
      key: COLUMN_KEYS.REPEATS,
      title: isOngoingMode ? (
        <ThemedTooltip
          title={
            <TranslatedText
              stringId="pharmacyOrder.table.column.repeats.tooltip"
              fallback="Remaining prescriptions available to dispense"
            />
          }
          $maxWidth="150px"
        >
          <span>
            <TranslatedText
              stringId="pharmacyOrder.table.column.repeats"
              fallback="Remaining"
              data-testid="translatedtext-psdf"
            />
          </span>
        </ThemedTooltip>
      ) : (
        <TwoLineHeaderText>
          <TranslatedText
            stringId="pharmacyOrder.table.column.repeatsOnDischarge"
            fallback="Repeats on discharge"
            data-testid="translatedtext-psdf"
          />
        </TwoLineHeaderText>
      ),
      sortable: false,
      accessor: ({ repeats, lastOrderedAt }) => {
        // Encounter level: show "Repeats on discharge" — use the raw repeats total.
        if (!isOngoingMode) return repeats;
        // Patient level: show "Remaining" (prescriptions available to dispense).
        // The first send is not counted as a repeat. When never sent (no lastOrderedAt),
        // remaining = initial + repeats = repeats + 1. Once sent, repeats is decremented
        // on the backend per send, so it already represents remaining.
        if (!lastOrderedAt) return Number(repeats) + 1;
        return repeats;
      },
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
      accessor: ({ quantity, onChange, hasError }) => (
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
          helperText={
            hasError && (
              <TranslatedText
                stringId="validation.required.inline"
                fallback="*Required"
              />
            )
          }
          data-testid="textinput-rxbh"
        />
      ),
    },
  ];

  return allColumns.filter(column => columnsToInclude.includes(column.key));
};

export const PharmacyOrderMedicationTable = ({
  data,
  error,
  isLoading,
  cellOnChange,
  handleSelectAll,
  selectAllChecked,
  columnsToInclude,
  isOngoingMode = false,
  disabledPrescriptionIds = [],
}) => {
  const { getTranslation, getEnumTranslation } = useTranslation();

  const disabledIdsKey = disabledPrescriptionIds.join(',');

  const columns = useMemo(
    () =>
      getColumns(
        getTranslation,
        getEnumTranslation,
        handleSelectAll,
        selectAllChecked,
        columnsToInclude,
        { isOngoingMode, disabledPrescriptionIds },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      getTranslation,
      getEnumTranslation,
      handleSelectAll,
      selectAllChecked,
      columnsToInclude,
      isOngoingMode,
      disabledIdsKey,
    ],
  );

  return (
    <StyledTable
      headerColor={Colors.white}
      columns={columns}
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
