import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import moment from 'moment';
import { TRIAGE_CATEGORIES } from './TriageDashboard';

// Cell color cannot be set on the component due to the way table cells are configured so the
// cell color must be calculated and set in the table config separately
export const getTriageCellColor = ({ score }) =>
  TRIAGE_CATEGORIES.find(c => c.level === parseInt(score))?.color;

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

const TriageCell = styled(PlainCell)`
  font-weight: 500;
  color: white;
`;

export const TriageWaitTimeCell = React.memo(({ encounterType, triageTime, closedTime }) => {
  const [, updateState] = useState({});

  // recalculate every 30 seconds
  useEffect(() => {
    if (!closedTime) {
      const interval = setInterval(() => updateState({}), MINUTE * 0.5);
      return () => clearInterval(interval);
    }
    return () => {};
  }, [closedTime]);

  switch (encounterType) {
    case 'triage':
      return (
        <TriageCell>
          <div>{getDuration(triageTime)}</div>
          <div>{`Triage at ${moment(triageTime).format('h:mma')}`}</div>
        </TriageCell>
      );
    case 'observation':
      return <TriageCell>{`Seen at ${moment(closedTime).format('h:mma')}`}</TriageCell>;
    default:
      return <PlainCell>Admitted</PlainCell>;
  }
});
