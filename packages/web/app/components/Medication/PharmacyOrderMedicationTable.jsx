import Box from '@mui/material/Box';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { MEDICATION_DURATION_DISPLAY_UNITS_LABELS } from '@tamanu/constants';
import {
  getDrugUnitLabel,
  getMedicationDoseDisplay,
  getTranslatedFrequency,
} from '@tamanu/shared/utils/medication';
import {
  ConditionalTooltip,
  DateDisplay,
  NumberInput,
  OuterLabelFieldWrapper,
  RequiredOrnament,
  ThemedTooltip,
  TimeDisplay,
  TranslatedReferenceData,
  TranslatedText,
  useTranslation,
} from '@tamanu/ui-components';
import { trimToDate } from '@tamanu/utils/dateTime';
import { Colors } from '../../constants/styles';
import { singularize } from '../../utils';
import { CheckInput } from '../Field';
import { Table } from '../Table';

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
    span:not(${RequiredOrnament}),
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
  columnsToInclude = Object.values(COLUMN_KEYS),
  { isOngoingMode = false } = {},
) => {
  const includes = new Set(columnsToInclude);
  const allColumns = [
    {
      key: COLUMN_KEYS.SELECT,
      // Title is injected by PharmacyOrderMedicationTable so select-all state
      // updates do not recreate column accessors (which remount inputs).
      title: null,
      sortable: false,
      accessor: ({ selected, onSelect, isSelectionDisabled }) => {
        const isDisabled = Boolean(isSelectionDisabled);
        return (
          <ConditionalTooltip
            visible={isDisabled}
            title={
              <TranslatedText
                stringId="medication.sendToPharmacy.noRepeatsRemaining"
                fallback="Only medications with repeats greater than 0 can be sent to pharmacy"
              />
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
      title: <TranslatedText stringId="medication.medication.label" fallback="Medication" />,
      sortable: false,
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
      title: <TranslatedText stringId="medication.dose.label" fallback="Dose" />,
      sortable: false,
      accessor: ({ doseAmount, dosingUnit, isVariableDose }) =>
        getMedicationDoseDisplay(
          { doseAmount, dosingUnit, isVariableDose },
          getTranslation,
          getEnumTranslation,
        ),
    },
    {
      key: COLUMN_KEYS.FREQUENCY,
      title: <TranslatedText stringId="medication.frequency.label" fallback="Frequency" />,
      sortable: false,
      accessor: ({ frequency }) =>
        frequency ? getTranslatedFrequency(frequency, getTranslation) : '',
    },
    {
      key: COLUMN_KEYS.DURATION,
      title: <TranslatedText stringId="medication.details.duration" fallback="Duration" />,
      sortable: false,
      accessor: ({ durationValue, durationUnit }) => {
        if (!durationValue || !durationUnit) {
          return <>&mdash;</>;
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
      title: <TranslatedText stringId="general.date.label" fallback="Date" />,
      sortable: false,
      accessor: ({ date }) => <DateDisplay date={trimToDate(date)} format="shortest" />,
    },
    {
      key: COLUMN_KEYS.LAST_SENT,
      title: <TranslatedText stringId="medication.table.column.lastSent" fallback="Last sent" />,
      sortable: false,
      accessor: ({ lastOrderedAt }) => {
        if (!lastOrderedAt) {
          return (
            <NoWrapCell color="inherit" fontStyle="normal">
              <TranslatedText
                stringId="general.fallback.notApplicable"
                fallback="N/A"
                casing="lower"
              />
            </NoWrapCell>
          );
        }

        return (
          <NoWrapCell color="inherit" fontStyle="normal">
            <Box>
              <DateDisplay date={lastOrderedAt} format="shortest" />
              <Box fontSize="12px" color={Colors.softText}>
                <TimeDisplay date={lastOrderedAt} />
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
            <TranslatedText stringId="pharmacyOrder.table.column.repeats" fallback="Remaining" />
          </span>
        </ThemedTooltip>
      ) : (
        <TwoLineHeaderText>
          <TranslatedText
            stringId="pharmacyOrder.table.column.repeatsOnDischarge"
            fallback="Repeats on discharge"
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
            <TranslatedText stringId="pharmacyOrder.table.column.quantity" fallback="Quantity" />
          }
          required
        />
      ),
      sortable: false,
      accessor: ({ quantity, onChange, hasError, dispensingUnit }) => (
        <NumberInput
          min={1}
          unit={
            dispensingUnit
              ? getDrugUnitLabel(dispensingUnit, quantity, getEnumTranslation)
              : undefined
          }
          value={quantity}
          onChange={onChange}
          required
          error={hasError}
          helperText={
            hasError && (
              <TranslatedText stringId="validation.required.inline" fallback="*Required" />
            )
          }
          data-testid="textinput-rxbh"
        />
      ),
    },
  ];

  return allColumns.filter(column => includes.has(column.key));
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
}) => {
  const { getTranslation, getEnumTranslation } = useTranslation();

  /**
   * Memoised separately from `columns` below to avoid reinstantiating column accessors as much as
   * possible. This keeps references to <NumberInput>s in `columns` more stable, so we don’t get
   * this horrible UX: type into empty ‘Quantity’ field → row is auto-selected → field remounts →
   * focus lost.
   */
  const baseColumns = useMemo(
    () =>
      getColumns(getTranslation, getEnumTranslation, columnsToInclude, {
        isOngoingMode,
      }),
    [columnsToInclude, getEnumTranslation, getTranslation, isOngoingMode],
  );
  const columns = useMemo(
    () =>
      baseColumns.map(column =>
        column.key === COLUMN_KEYS.SELECT
          ? {
              ...column,
              title: (
                <CheckInput
                  data-testid="select-all-checkbox"
                  onChange={handleSelectAll}
                  style={{ margin: 'auto' }}
                  value={selectAllChecked}
                />
              ),
            }
          : column,
      ),
    [baseColumns, selectAllChecked, handleSelectAll],
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
        />
      }
      allowExport={false}
      cellOnChange={cellOnChange}
      data-testid="table-3r2b"
    />
  );
};
