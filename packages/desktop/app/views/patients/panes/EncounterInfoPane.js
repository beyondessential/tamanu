import React from 'react';
import styled from 'styled-components';
import { formatShort } from '../../../components';
import { Colors, ENCOUNTER_OPTIONS_BY_VALUE } from '../../../constants';
import { getFullLocationName } from '../../../utils/location';

const Card = styled.div`
  background: white;
  box-shadow: 2px 2px 25px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  padding: 32px 30px;
  border: 1px solid ${Colors.outline};
`;

const CardHeader = styled.div`
  border-bottom: 1px solid ${Colors.softOutline};
  padding-bottom: 12px;
  margin-bottom: 15px;
`;

const CardBody = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 30px;
  grid-row-gap: 18px;
  max-width: 1050px;
`;

const CardDivider = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-3px);
  height: ${props => props.$height || '70px'};
  border-left: 1px solid ${Colors.softOutline};
`;

const CardCell = styled.div`
  font-size: 16px;
  line-height: 21px;
  margin-bottom: 2px;
  color: ${props => props.theme.palette.text.tertiary};
`;

const CardLabel = styled.span`
  margin-right: 5px;
`;

const CardValue = styled(CardLabel)`
  font-weight: 500;
  color: ${props => props.theme.palette.text.secondary};
`;

const CardItem = ({ label, value, ...props }) => (
  <CardCell {...props}>
    <CardLabel>{label}:</CardLabel>
    <CardValue>{value}</CardValue>
  </CardCell>
);

const getDepartmentName = ({ department }) => (department ? department.name : 'Unknown');
const getReferralSource = ({ referralSource }) =>
  referralSource ? referralSource.name : 'Unknown';

export const getEncounterType = ({ encounterType }) =>
  encounterType ? ENCOUNTER_OPTIONS_BY_VALUE[encounterType]?.label : 'Unknown';

const referralSourcePath = 'fields.referralSourceId';

export const EncounterInfoPane = React.memo(
  ({ encounter, getLocalisation, patientBillingType }) => (
    <Card>
      {encounter.plannedLocation && (
        <CardHeader>
          <CardItem label="Planned move" value={getFullLocationName(encounter.plannedLocation)} />
        </CardHeader>
      )}
      <CardBody>
        <CardDivider />
        <CardItem label="Department" value={getDepartmentName(encounter)} />
        <CardItem label="Patient type" value={patientBillingType} />
        <CardItem label="Location" value={getFullLocationName(encounter?.location)} />
        {!getLocalisation(`${referralSourcePath}.hidden`) && (
          <CardItem
            label={getLocalisation(`${referralSourcePath}.shortLabel`)}
            value={getReferralSource(encounter)}
          />
        )}
        <CardItem label="Encounter type" value={getEncounterType(encounter)} />
        {encounter.endDate && (
          <CardItem label="Discharge date" value={formatShort(encounter.endDate)} />
        )}
        <CardItem label="Reason for encounter" value={encounter.reasonForEncounter} />
      </CardBody>
    </Card>
  ),
);
