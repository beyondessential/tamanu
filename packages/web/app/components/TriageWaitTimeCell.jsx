import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Tooltip from '@material-ui/core/Tooltip';
import { ENCOUNTER_TYPES } from '@tamanu/constants/encounters';
import { useDateTime } from '@tamanu/ui-components';
import { TranslatedText } from './Translation/TranslatedText';
import {
  MINUTE,
  getTriageStartTime,
  getTriageWaitTime,
  splitDurationHoursMinutes,
} from '../utils/triageWaitTime';

const getDisplayedWaitTime = (triage, storedDateTimeToEpochMilliseconds) => {
  const waitTime = getTriageWaitTime(triage, storedDateTimeToEpochMilliseconds);
  if (waitTime == null) return '—';
  const { hours, minutes } = splitDurationHoursMinutes(waitTime);
  return `${hours}hrs ${minutes}mins`;
};

const PlainCell = styled.div`
  font-size: 14px;
  line-height: 18px;
`;

const ColourCell = styled(PlainCell)`
  font-weight: 500;
  color: white;
`;

const TriageCell = ({ arrivalTime, children, 'data-testid': dataTestId = 'colourcell-1o42' }) => {
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
      <ColourCell data-testid={dataTestId}>{children}</ColourCell>
    </Tooltip>
  );
};

const SeenWaitTimeCell = ({ arrivalTime, closedTime, encounterTypeLabel, dataTestId }) => {
  const { formatTime } = useDateTime();

  return (
    <TriageCell arrivalTime={arrivalTime} data-testid={dataTestId}>
      <div>
        <TranslatedText
          stringId="patientList.triage.table.waitTime.cell.closedTime"
          fallback="Seen at :triageDate"
          replacements={{ triageDate: formatTime(closedTime) }}
          data-testid="translatedtext-hfkc"
        />
      </div>
      <div>{encounterTypeLabel}</div>
    </TriageCell>
  );
};

export const TriageWaitTimeCell = React.memo(
  ({ encounterType, triageTime, closedTime, arrivalTime }) => {
    const [, updateState] = useState({});
    const { formatTime, storedDateTimeToEpochMilliseconds } = useDateTime();

    const assumedArrivalTime = getTriageStartTime({ arrivalTime, triageTime });

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
            <div>
              {getDisplayedWaitTime({ arrivalTime, triageTime }, storedDateTimeToEpochMilliseconds)}
            </div>
            <div>
              <TranslatedText
                stringId="patientList.triage.table.waitTime.cell.triageTime"
                fallback="Triage at :triageDate"
                replacements={{ triageDate: formatTime(triageTime) }}
                data-testid="translatedtext-wovf"
              />
            </div>
          </TriageCell>
        );
      case ENCOUNTER_TYPES.OBSERVATION:
        return (
          <SeenWaitTimeCell
            arrivalTime={assumedArrivalTime}
            closedTime={closedTime}
            dataTestId="triagecell-observation"
            encounterTypeLabel={
              <TranslatedText
                stringId="patientList.triage.table.waitTime.cell.activeED"
                fallback="Active ED"
                data-testid="translatedtext-active-ed-care"
              />
            }
          />
        );
      case ENCOUNTER_TYPES.EMERGENCY:
        return (
          <SeenWaitTimeCell
            arrivalTime={assumedArrivalTime}
            closedTime={closedTime}
            dataTestId="triagecell-emergency"
            encounterTypeLabel={
              <TranslatedText
                stringId="patientList.triage.table.waitTime.cell.emergencyShortStay"
                fallback="Emerg. short stay"
                data-testid="translatedtext-emergency-short-stay"
              />
            }
          />
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
