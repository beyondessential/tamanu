import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Tooltip from '@material-ui/core/Tooltip';
import { ENCOUNTER_TYPES } from '@tamanu/constants/encounters';
import { getCurrentLanguageCode, useDateTime } from '@tamanu/ui-components';
import { TranslatedText } from './Translation/TranslatedText';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/**
 * Duration from stored arrival time to now. Uses primary timezone to parse the stored
 * datetime so the result is not offset by the user's browser timezone.
 */
const getDuration = (startTime, storedDateTimeToEpochMilliseconds) => {
  const startMs = storedDateTimeToEpochMilliseconds(startTime);
  if (startMs == null) return '—';
  const time = Date.now() - startMs;
  const hours = Math.floor(time / HOUR);
  const minutes = Math.floor((time - hours * HOUR) / MINUTE);
  const formatter = new Intl.DurationFormat(getCurrentLanguageCode(), { style: 'short' });
  return <time dateTime={`${hours}h ${minutes}m`}>{formatter.format({ hours, minutes })}</time>;
};

const PlainCell = styled.div`
  font-size: 14px;
  line-height: 18px;
`;

const ColourCell = styled(PlainCell)`
  font-weight: 500;
  color: white;
`;

const TriageCell = ({ arrivalTime, children }) => {
  const { formatShortDateTime } = useDateTime();
  return (
    <Tooltip
      title={
        <TranslatedText
          stringId="patientList.triage.table.waitTime.arrivalTime.toolTip"
          fallback="Arrival time: :arrivalTime"
          replacements={{ arrivalTime: formatShortDateTime(arrivalTime) }}
          data-testid="translatedtext-z21d"
        />
      }
      arrow
      placement="top"
      data-testid="tooltip-dfw8"
    >
      <ColourCell data-testid="colourcell-1o42">{children}</ColourCell>
    </Tooltip>
  );
};

export const TriageWaitTimeCell = React.memo(
  ({ encounterType, triageTime, closedTime, arrivalTime }) => {
    const [, updateState] = useState({});
    const { formatTime, storedDateTimeToEpochMilliseconds } = useDateTime();

    // arrivalTime is an optional field and the ui prompts the user to enter it only if arrivalTime
    // is different to triageTime so we should assume the arrivalTime is the triageTime if arrivalTime
    // is undefined
    const assumedArrivalTime = arrivalTime || triageTime;

    // recalculate every 30 seconds
    useEffect(() => {
      if (!closedTime) {
        const interval = setInterval(() => updateState({}), MINUTE * 0.5);
        return () => clearInterval(interval);
      }
      return () => {};
    }, [closedTime]);

    switch (encounterType) {
      case ENCOUNTER_TYPES.TRIAGE:
        return (
          <TriageCell arrivalTime={assumedArrivalTime} data-testid="triagecell-xrcr">
            {getDuration(assumedArrivalTime, storedDateTimeToEpochMilliseconds)}
            <div>
              <TranslatedText
                stringId="patientList.triage.table.waitTime.cell.triageTime"
                fallback="Triage at"
                data-testid="translatedtext-wovf"
              />{' '}
              <time dateTime={triageTime}>{formatTime(triageTime)}</time>
            </div>
          </TriageCell>
        );
      case ENCOUNTER_TYPES.OBSERVATION:
      case ENCOUNTER_TYPES.EMERGENCY:
        return (
          <TriageCell arrivalTime={assumedArrivalTime} data-testid="triagecell-fk2v">
            <TranslatedText
              stringId="patientList.triage.table.waitTime.cell.closedTime"
              fallback="Seen at"
              data-testid="translatedtext-hfkc"
            />{' '}
            <time dateTime={closedTime}>{formatTime(closedTime)}</time>
          </TriageCell>
        );
      default:
        return (
          <PlainCell data-testid="plaincell-c92q">
            <TranslatedText
              stringId="patientList.triage.table.waitTime.cell.admitted"
              fallback="Admitted"
              data-testid="translatedtext-mxyw"
            />
          </PlainCell>
        );
    }
  },
);
