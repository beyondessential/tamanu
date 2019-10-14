import React from 'react';
import styled from 'styled-components';

import { DateDisplay } from '../../../components/DateDisplay';

const Grid = styled.div`
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  grid-template-columns: 1fr auto;
  border: 1px solid black;
  margin: 1rem auto;
  padding: 16px;
  height: min-content;
  width: fit-content;
  text-transform: capitalize;
`;

const Title = styled.h4`
  margin: 0;
`;

const FlexRow = styled.div`
  display: flex;

  > div {
    margin-right: 2rem;
  }
`;

const Label = styled.span`
  font-weight: 500;
`;

export const PatientVisitSummary = ({ visits }) => {
  const visit = visits.find(x => !x.endDate);
  console.log(visit);

  if (!visit) return null;

  const { startDate, location, visitType, reasonForVisit } = visit;
  return (
    <Grid>
      <div>
        <Title>Current Visit</Title>
        <FlexRow>
          <div>
            <Label>Admitted: </Label>
            <DateDisplay date={startDate} />
          </div>
          <div>
            <Label>Location: </Label>
            {location.name}
          </div>
          <div>
            <Label>Type: </Label> {visitType}
          </div>
        </FlexRow>
        <div>
          <hr />
          {reasonForVisit}
        </div>
      </div>
      <div style={{ margin: '10px' }}>View</div>
    </Grid>
  );
};
