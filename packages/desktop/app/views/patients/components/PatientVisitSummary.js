import React from 'react';
import styled from 'styled-components';

import { Colors } from '../../../constants';
import { Button, AlertButton } from '../../../components/Button';
import { DateDisplay } from '../../../components/DateDisplay';

const Grid = styled.div`
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  grid-template-columns: 1fr auto;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  margin: 1rem;
  height: min-content;
  width: fit-content;
  background: ${Colors.white};
`;

const LeftColumn = styled.div`
  padding: 16px;
`;

const Title = styled.h3`
  margin: ${props => (props.isAdmitted ? '0 0 5px 0' : '1em')};
`;

const FlexRow = styled.div`
  display: flex;
  margin-bottom: 5px;
  text-transform: capitalize;

  > div {
    margin-right: 2rem;
  }
`;

const ButtonsContainer = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: 1fr 1fr;

  button:last-of-type {
    border-radius: 0;
  }
`;

const Label = styled.span`
  font-weight: 500;
`;

const Divider = styled.hr`
  width: 50px;
  border-top: 1px solid ${Colors.outline};
  border-bottom: 0;
  border-left: 0;
  border-right: 0;
`;

const ViewButton = styled(Button)`
  border-radius: 0;
  min-width: 80px;
`;

export const PatientVisitSummary = ({ visits, viewVisit, openCheckin, openTriage }) => {
  const visit = visits.find(x => !x.endDate);

  if (!visit) {
    return (
      <Grid>
        <LeftColumn>
          <Title isAdmitted={!!visit}>Not currently admitted</Title>
        </LeftColumn>
        <ButtonsContainer>
          <ViewButton onClick={() => openCheckin()} variant="contained" color="primary">
            Admit
          </ViewButton>
          <AlertButton onClick={() => openTriage()} variant="contained">
            Triage
          </AlertButton>
        </ButtonsContainer>
      </Grid>
    );
  }

  const { startDate, location, visitType, reasonForVisit, _id } = visit;
  return (
    <Grid>
      <LeftColumn>
        <Title isAdmitted={!!visit}>Current Visit</Title>
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
        <Divider />
        <div>{reasonForVisit}</div>
      </LeftColumn>
      <ViewButton onClick={() => viewVisit(_id)} variant="contained" color="primary">
        View
      </ViewButton>
    </Grid>
  );
};
