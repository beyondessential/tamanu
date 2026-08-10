import React from 'react';
import styled from 'styled-components';

import { ADMINISTRATION_STATUS, DRUG_UNIT_SHORT_LABELS } from '@tamanu/constants';
import {
  DateDisplay,
  ThemedTooltip,
  TranslatedEnum,
  TranslatedText,
  useDateTime,
  VisuallyHidden,
} from '@tamanu/ui-components';
import { MarDoseSlot } from './components';

/**
 * Phrasing content only, since this text is also rendered inside `MarCellButton`, which cannot
 * contain flow content.
 */
const TooltipText = styled.span`
  display: block;
  text-wrap: balance;
`;

const Span = styled.span`
  display: block;
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
            <Span>
              <TranslatedText stringId="medication.mar.error" fallback="Error." />
            </Span>
          )}
          {isAlert && !isError && (
            <Span>
              <TranslatedText stringId="medication.mar.alert" fallback="Alert." />
            </Span>
          )}
          <Span>
            <TranslatedText stringId="medication.mar.notGiven" fallback="Not given" />
          </Span>
          <Span>{reasonNotGiven?.name}</Span>
        </>
      );
    case ADMINISTRATION_STATUS.GIVEN:
      return (
        <>
          <Span>
            {isError && <TranslatedText stringId="medication.mar.error" fallback="Error." />}
            {isAlert && !isError && (
              <TranslatedText stringId="medication.mar.alert" fallback="Alert." />
            )}
          </Span>
          {marDoses?.map(
            dose =>
              !dose.isRemoved && (
                <Span key={dose?.id}>
                  {dose?.doseAmount}&nbsp;
                  <TranslatedEnum enumValues={DRUG_UNIT_SHORT_LABELS} value={dosingUnit} />{' '}
                  <TranslatedText
                    stringId="medication.mar.givenAt.tooltip"
                    fallback="given at :time"
                    replacements={{ time: formatTime(dose?.givenTime) }}
                  />
                </Span>
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

export const MarStatusLabel = props =>
  hasMarStatusTooltip(props) ? (
    <VisuallyHidden>
      <TooltipText>
        <MarStatusTooltipContent {...props} />
      </TooltipText>
    </VisuallyHidden>
  ) : null;

export const MarStatusTooltip = ({ children, ...tooltipProps }) => {
  const slot = <MarDoseSlot>{children}</MarDoseSlot>;
  if (!hasMarStatusTooltip(tooltipProps)) return slot;

  return (
    <ThemedTooltip
      title={
        <TooltipText>
          <MarStatusTooltipContent {...tooltipProps} />
        </TooltipText>
      }
      PopperProps={popperProps}
    >
      {slot}
    </ThemedTooltip>
  );
};
