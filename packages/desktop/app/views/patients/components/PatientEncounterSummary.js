import React from 'react';
import styled from 'styled-components';

import { ENCOUNTER_TYPES } from 'Shared/constants';
import { Colors } from '../../../constants';
import { ImageButton, Button } from '../../../components/Button';
import { DateDisplay } from '../../../components/DateDisplay';

import { medicationIcon, profileIcon } from '../../../constants/images';

/** TODO: Properly define colors for each type (primary is placeholder/default) */
const ENCOUNTER_TYPE_COLORS = {
  [ENCOUNTER_TYPES.ADMISSION]: Colors.safe,
  [ENCOUNTER_TYPES.CLINIC]: Colors.primary,
  [ENCOUNTER_TYPES.IMAGING]: Colors.primary,
  [ENCOUNTER_TYPES.EMERGENCY]: Colors.alert,
  [ENCOUNTER_TYPES.OBSERVATION]: Colors.safe,
  [ENCOUNTER_TYPES.TRIAGE]: Colors.alert,
  [undefined]: Colors.primary,
};

const Grid = styled.div`
  display: grid;
  grid-template-rows: 1fr auto;
  margin: 1rem;
  border: 1px solid ${Colors.outline};
  border-left-color: ${props => ENCOUNTER_TYPE_COLORS[props.encounterType]};
  border-left-width: 5px;
  border-radius: 5px;
  background: ${Colors.white};
  width: ${props => props.notAdmitted && 'fit-content'};
  cursor: pointer;
`;

const Header = styled.div`
  border-bottom: 1px solid ${Colors.outline};
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
`;

const HeaderInfo = styled.div`
  display: flex;
  padding: 10px 20px;
`;

const Actions = styled.div`
  display: flex;
`;

const Content = styled.div`
  padding: ${props => !props.notAdmitted && '10px 20px'};
  display: grid;
  grid-auto-flow: column;
`;

const ContentColumn = styled.div`
  display: grid;
  align-content: end;
`;

const SubTitle = styled.p`
  margin: 0 20px 0 0;
  font-weight: 500;
`;

const Title = styled.p`
  margin: ${props => (props.notAdmitted ? 'auto 20px' : '0 0 10px 0')};
  font-weight: 600;
  color: ${props => ENCOUNTER_TYPE_COLORS[props.encounterType]};
  font-size: 1.2rem;

  &::first-letter {
    text-transform: uppercase;
  }
`;

const Icon = styled.i`
  color: ${Colors.outline};
`;

const Label = styled.span`
  font-weight: 500;
  color: ${Colors.darkText};
`;

const Text = styled.span`
  color: ${Colors.midText};
  text-transform: capitalize;
`;

const StyledImageButton = styled(ImageButton)`
  border-radius: 0;
  box-shadow: none;
`;

const FirstButton = styled(StyledImageButton)`
  border-left: 1px solid ${Colors.outline};
  border-right: 1px solid ${Colors.outline};
`;

const ViewButton = styled(Button)`
  border-radius: 0;
  min-width: 80px;
`;

export const PatientEncounterSummary = ({ viewEncounter, openCheckin, openTriage, encounter }) => {
  if (!encounter) {
    return (
      <Grid notAdmitted>
        <Content notAdmitted>
          <Title notAdmitted>Not currently admitted</Title>
          <Actions>
            <FirstButton src={medicationIcon} title="Admit" onClick={openCheckin}>
              Admit
            </FirstButton>
            <StyledImageButton src={profileIcon} title="Triage" onClick={openTriage}>
              Triage
            </StyledImageButton>
          </Actions>
        </Content>
      </Grid>
    );
  }

  const { startDate, location, encounterType, reasonForEncounter, id, examiner } = encounter;
  return (
    <Grid encounterType={encounterType} onClick={() => viewEncounter(id)}>
      <Header>
        <HeaderInfo>
          <SubTitle>Current admission</SubTitle>
          <div>
            <Icon className="fas fa-map-marker-alt" /> <Label>Location: </Label>
            <Text>{location ? location.name : '-'}</Text>
          </div>
        </HeaderInfo>
        <Actions>
          <ViewButton variant="contained" color="primary">
            View
          </ViewButton>
        </Actions>
      </Header>
      <Content>
        <div>
          <Title encounterType={encounterType}>{encounterType}</Title>
          <Label>Reason for encounter: </Label> <Text>{reasonForEncounter}</Text>
        </div>
        <ContentColumn>
          <Label>Arrival date</Label>
          <Text>
            <DateDisplay date={startDate} />
          </Text>
        </ContentColumn>

        <ContentColumn>
          <Label>Supervising doctor/nurse</Label>
          <Text>{examiner ? examiner.displayName : '-'}</Text>
        </ContentColumn>
      </Content>
    </Grid>
  );
};
