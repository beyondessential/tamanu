import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import Tooltip from '@material-ui/core/Tooltip';
import { ENCOUNTER_TYPES } from '@tamanu/constants/encounters';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const getDuration = startTime => {
  const time = new Date() - new Date(startTime);
  const hours = Math.floor(time / HOUR);
  const minutes = Math.floor((time - hours * HOUR) / MINUTE);
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

const TriageCell = ({ arrivalTime, children }) => (
  <Tooltip title={`Arrival time: ${arrivalTime}`} arrow placement="top">
    <ColourCell>{children}</ColourCell>
  </Tooltip>
);

export const TriageWaitTimeCell = React.memo(
  ({ encounterType, triageTime, closedTime, arrivalTime }) => {
    const [, updateState] = useState({});

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
          <TriageCell arrivalTime={assumedArrivalTime}>
            <div>{getDuration(assumedArrivalTime)}</div>
            <div>{`Triage at ${format(new Date(triageTime), 'h:mma')}`}</div>
          </TriageCell>
        );
      case ENCOUNTER_TYPES.OBSERVATION:
      case ENCOUNTER_TYPES.EMERGENCY:
        return (
          <TriageCell arrivalTime={assumedArrivalTime}>
            {`Seen at ${format(new Date(closedTime), 'h:mma')}`}
          </TriageCell>
        );
      default:
        return <PlainCell>Admitted</PlainCell>;
    }
  },
);
