import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Tooltip from '@material-ui/core/Tooltip';
import { ENCOUNTER_TYPES } from '@tamanu/constants/encounters';
import { useDateTimeFormat } from '@tamanu/ui-components';
import { TranslatedText } from './Translation/TranslatedText';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const getDuration = (startTime) => {
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
  <Tooltip
    title={
      <TranslatedText
        stringId="patientList.triage.table.waitTime.arrivalTime.toolTip"
        fallback="Arrival time: :arrivalTime"
        replacements={{ arrivalTime }}
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

export const TriageWaitTimeCell = React.memo(
  ({ encounterType, triageTime, closedTime, arrivalTime }) => {
    const [, updateState] = useState({});
    const { formatTime } = useDateTimeFormat();

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
            <div>{getDuration(assumedArrivalTime)}</div>
            <div>
              <TranslatedText
                stringId="patientList.triage.table.waitTime.cell.triageTime"
                fallback="Triage at :triageDate"
                replacements={{ triageDate: formatTime(triageTime, { removeWhitespace: true }) }}
                data-testid="translatedtext-wovf"
              />
            </div>
          </TriageCell>
        );
      case ENCOUNTER_TYPES.OBSERVATION:
      case ENCOUNTER_TYPES.EMERGENCY:
        return (
          <TriageCell arrivalTime={assumedArrivalTime} data-testid="triagecell-fk2v">
            <TranslatedText
              stringId="patientList.triage.table.waitTime.cell.closedTime"
              fallback="Seen at :triageDate"
              replacements={{ triageDate: formatTime(closedTime, { removeWhitespace: true }) }}
              data-testid="translatedtext-hfkc"
            />
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
