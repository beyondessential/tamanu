//@ts-check
import React, { useState } from 'react';
import styled from 'styled-components';
import CloseIcon from '@material-ui/icons/Close';
import { Colors } from '../../constants';
import { Heading5 } from '../../components/Typography';
import { IconButton } from '@material-ui/core';
import { useApi } from '../../api';
import { usePatientProgramRegistryConditions } from '../../api/queries/usePatientProgramRegistryConditions';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { RemoveConditionFormModal } from './RemoveConditionFormModal';
import { AddConditionFormModal } from './AddConditionFormModal';

const Container = styled.div`
  background-color: ${Colors.white};
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: center;
`;

const HeadingContainer = styled.div`
  border-bottom: 1px solid ${Colors.softOutline};
  padding-bottom: 10px;
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
`;

export const ConditionSection = ({ patientProgramRegistry }) => {
  const api = useApi();
  const { data, isLoading } = usePatientProgramRegistryConditions(patientProgramRegistry.programId);
  const [conditionToRemove, setConditionToRemove] = useState();
  const [openAddCondition, setOpenAddCondition] = useState(false);

  const removeCondition = () => {
    api.delete('/asdasdasdasd');
  };

  if (isLoading) return <LoadingIndicator />;
  return (
    <Container>
      <HeadingContainer>
        <Heading5>Conditions</Heading5>
        <AddConditionButton onClick={() => setOpenAddCondition(true)}>
          + Add condition
        </AddConditionButton>
      </HeadingContainer>
      {data.map(x => (
        <ConditionContainer>
          <span>{x.name}</span>
          <IconButton style={{ padding: 0 }} onClick={() => setConditionToRemove(x)}>
            <CloseIcon style={{ fontSize: '14px' }} />
          </IconButton>
        </ConditionContainer>
      ))}
      {openAddCondition && (
        <AddConditionFormModal
          onSubmit={() => setOpenAddCondition(false)}
          onCancel={() => setOpenAddCondition(false)}
          programRegistry={patientProgramRegistry}
          open
        />
      )}
      {conditionToRemove && (
        <RemoveConditionFormModal
          condition={conditionToRemove}
          onSubmit={() => setConditionToRemove(undefined)}
          onCancel={() => setConditionToRemove(undefined)}
          open
        />
      )}
    </Container>
  );
};
