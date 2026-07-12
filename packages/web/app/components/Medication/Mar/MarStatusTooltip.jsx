import Box from '@mui/material/Box';
import React from 'react';
import styled from 'styled-components';

import { ADMINISTRATION_STATUS, DRUG_UNIT_SHORT_LABELS } from '@tamanu/constants';
import {
  DateDisplay,
  TranslatedEnum,
  TranslatedText,
  useDateTime,
  VisuallyHidden,
  ConditionalTooltip,
} from '@tamanu/ui-components';

const TooltipText = styled.div`
  margin-block: 0;
  text-wrap: balance;
  p {
    margin-block: 0;
  }
`;

const popperProps = /** @type {const} */ ({
  popperOptions: {
    positionFixed: true,
    modifiers: {
      preventOverflow: {
        enabled: true,
        boundariesElement: 'window',
      },
    },
  },
});

export const hasMarStatusTooltip = ({
  isDiscontinued,
  isEnd,
  isPaused,
  isPast,
  isPrn,
  marInfo,
  status,
}) => {
  if (isDiscontinued || isEnd || (isPaused && !status)) return true;
  if (!marInfo) return false;
  if (status === ADMINISTRATION_STATUS.NOT_GIVEN || status === ADMINISTRATION_STATUS.GIVEN) {
    return true;
  }
  return !(isPast && isPrn);
};

const MarStatusTooltipContent = ({
  dosingUnit,
  dueAt,
  endDate,
  isAlert,
  isDiscontinued,
  isEnd,
  isError,
  isNotDue,
  isPast,
  isPaused,
  isPrn,
  marDoses,
  marInfo,
  reasonNotGiven,
  status,
}) => {
  const { formatTime } = useDateTime();

  if (isDiscontinued) {
    return (
      <TranslatedText
        stringId="medication.mar.medicationDiscontinued.tooltip"
        fallback="Medication discontinued"
      />
    );
  }
  if (isEnd) {
    return (
      <>
        <TranslatedText stringId="medication.mar.endsOn.tooltip" fallback="Ends on" />{' '}
        <DateDisplay date={endDate} timeFormat="default" noTooltip />
      </>
    );
  }
  if (isPaused && !status) {
    return (
      <TranslatedText
        stringId="medication.mar.medicationPaused.tooltip"
        fallback="Medication paused"
      />
    );
  }
  if (!marInfo) return null;

  switch (status) {
    case ADMINISTRATION_STATUS.NOT_GIVEN:
      return (
        <>
          {isError && (
            <p>
              <TranslatedText stringId="medication.mar.error" fallback="Error." />
            </p>
          )}
          {isAlert && !isError && (
            <p>
              <TranslatedText stringId="medication.mar.alert" fallback="Alert." />
            </p>
          )}
          <p>
            <TranslatedText stringId="medication.mar.notGiven" fallback="Not given." />
          </p>
          <p>{reasonNotGiven?.name}</p>
        </>
      );
    case ADMINISTRATION_STATUS.GIVEN:
      return (
        <>
          <Box>
            {isError && <TranslatedText stringId="medication.mar.error" fallback="Error." />}
            {isAlert && !isError && (
              <p>
                <TranslatedText stringId="medication.mar.alert" fallback="Alert." />
              </p>
            )}
          </Box>
          {marDoses?.map(
            dose =>
              !dose.isRemoved && (
                <div key={dose?.id}>
                  {dose?.doseAmount}&nbsp;
                  <TranslatedEnum enumValues={DRUG_UNIT_SHORT_LABELS} value={dosingUnit} />{' '}
                  <TranslatedText
                    stringId="medication.mar.givenAt.tooltip"
                    fallback="given at :time"
                    replacements={{ time: formatTime(dose?.givenTime) }}
                  />
                </div>
              ),
          )}
        </>
      );
    default:
      if (isNotDue) {
        return (
          <TranslatedText
            stringId="medication.mar.future.tooltip"
            fallback="Cannot record future dose. Due at :dueAt."
            replacements={{ dueAt: formatTime(dueAt) }}
          />
        );
      }
      if (isPast) {
        return isPrn ? null : (
          <TranslatedText
            stringId="medication.mar.missed.tooltip"
            fallback="Missed. Due at :dueAt."
            replacements={{ dueAt: formatTime(dueAt) }}
          />
        );
      }
      return (
        <TranslatedText
          stringId="medication.mar.dueAt.tooltip"
          fallback="Due at :dueAt."
          replacements={{ dueAt: formatTime(dueAt) }}
        />
      );
  }
};

export const MarStatusTooltip = ({ children, ...tooltipProps }) => {
  const visible = hasMarStatusTooltip(tooltipProps);
  const title = visible ? (
    <TooltipText>
      <MarStatusTooltipContent {...tooltipProps} />
    </TooltipText>
  ) : null;

  return (
    <ConditionalTooltip visible={visible} title={title} PopperProps={popperProps}>
      {title && <VisuallyHidden>{title}</VisuallyHidden>}
      {children}
    </ConditionalTooltip>
  );
};
