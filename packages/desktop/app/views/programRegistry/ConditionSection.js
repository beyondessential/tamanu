import React, { useState } from 'react';
import styled from 'styled-components';
import CloseIcon from '@material-ui/icons/Close';
import { IconButton } from '@material-ui/core';
import { Colors, PROGRAM_REGISTRATION_STATUSES } from '../../constants';
import { Heading5 } from '../../components/Typography';
import { usePatientProgramRegistryConditions } from '../../api/queries/usePatientProgramRegistryConditions';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { RemoveConditionFormModal } from './RemoveConditionFormModal';
import { AddConditionFormModal } from './AddConditionFormModal';
import { ConditionalTooltip } from '../../components/Tooltip';

const Container = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  /* left: 0; */
  overflow-y: scroll;
  width: 28%;
  background-color: ${Colors.white};
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: flex-start;
  border: 1px solid ${Colors.softOutline};
  border-radius: 5px;
`;

const HeadingContainer = styled.div`
  border-bottom: 1px solid ${Colors.softOutline};
  padding-bottom: 20px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
  width: 100%;
`;

const ConditionContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
  width: 100%;
  margin-top: 5px;
`;

const ClippedConditionName = styled.span`
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-wrap: break-word;
  width: 95%;
`;

const AddConditionButton = styled.button`
  display: inline-block;
  padding: 10px 20px;
  color: ${Colors.darkestText};
  text-decoration: underline;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  padding: 0px;
  background-color: transparent;

  :hover {
    color: ${Colors.blue};
  }
  :disabled {
    color: ${Colors.darkText};
  }
`;

export const ConditionSection = ({ patientProgramRegistration }) => {
  // const api = useApi();
  const { data, isLoading } = usePatientProgramRegistryConditions(patientProgramRegistration.id);
  const [conditionToRemove, setConditionToRemove] = useState();
  const [openAddCondition, setOpenAddCondition] = useState(false);

  const removeCondition = () => {
    setConditionToRemove(undefined);
    // api.delete('/asdasdasdasd');
  };

  if (isLoading) return <LoadingIndicator />;

  const isRemoved =
    patientProgramRegistration.registrationStatus === PROGRAM_REGISTRATION_STATUSES.REMOVED;
  return (
    <Container>
      <HeadingContainer>
        <Heading5>Conditions</Heading5>
        <ConditionalTooltip title="Patient must be active" visible={isRemoved}>
          <AddConditionButton disabled onClick={() => setOpenAddCondition(true)}>
            + Add condition
          </AddConditionButton>
        </ConditionalTooltip>
      </HeadingContainer>
      {data.map(x => (
        <ConditionContainer key={x.id}>
          <ConditionalTooltip title={x.name} visible={x.name.length > 30}>
            <ClippedConditionName>{x.name}</ClippedConditionName>
          </ConditionalTooltip>
          <ConditionalTooltip title="Patient must be active" visible={isRemoved}>
            <IconButton disabled style={{ padding: 0 }} onClick={() => setConditionToRemove(x)}>
              <CloseIcon style={{ fontSize: '14px' }} />
            </IconButton>
          </ConditionalTooltip>
        </ConditionContainer>
      ))}
      {openAddCondition && (
        <AddConditionFormModal
          onSubmit={() => setOpenAddCondition(false)}
          onCancel={() => setOpenAddCondition(false)}
          programRegistry={patientProgramRegistration}
          open
        />
      )}
      {conditionToRemove && (
        <RemoveConditionFormModal
          condition={conditionToRemove}
          onSubmit={removeCondition}
          onCancel={() => setConditionToRemove(undefined)}
          open
        />
      )}
    </Container>
  );
};
