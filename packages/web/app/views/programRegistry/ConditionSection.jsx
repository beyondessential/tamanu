import React, { useState } from 'react';
import styled from 'styled-components';
import { sortBy } from 'lodash';
import { ButtonBase } from '@material-ui/core';
import { PROGRAM_REGISTRY_CONDITION_CATEGORIES } from '@tamanu/constants';
import { Heading5 } from '../../components/Typography';
import { usePatientProgramRegistryConditionsQuery } from '../../api/queries';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ConditionalTooltip } from '../../components/Tooltip';
import { Colors } from '../../constants';
import { UpdateConditionFormModal } from '../../features/ProgramRegistry';
import { TranslatedEnum } from '../../components/index.js';
import { useParams } from 'react-router-dom';

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const ScrollBody = styled.div`
  flex: 1;
  border-radius: 5px;
  border: 1px solid ${Colors.softOutline};
  padding: 5px 0;
`;

const Condition = styled(ButtonBase)`
  width: 100%;
  justify-content: flex-start;
  text-align: left;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 18px;

  &:hover {
    background-color: #f4f9ff;
  }
`;

const ClippedConditionName = styled.span`
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-wrap: break-word;
  width: 95%;
`;

export const ConditionSection = () => {
  const [selectedConditionId, setSelectedConditionId] = useState(null);
  const { patientId, programRegistryId } = useParams();
  const { data: conditions = [], isLoading } = usePatientProgramRegistryConditionsQuery(
    patientId,
    programRegistryId,
  );

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (!conditions.length) {
    return null;
  }

  const sortedConditions = sortBy(
    conditions,
    ({ programRegistryCondition }) => programRegistryCondition?.name,
  );

  const selectedCondition = conditions.find(({ id }) => id === selectedConditionId);
  const updateModalIsOpen = Boolean(selectedConditionId) && Boolean(selectedCondition);

  return (
    <Container>
      <Heading5 mt={0} mb={1}>
        Related conditions
      </Heading5>
      <ScrollBody>
        {sortedConditions.map(condition => {
          const { programRegistryCondition, conditionCategory } = condition;
          const { name } = programRegistryCondition;
          return (
            <Condition key={condition.id} onClick={() => setSelectedConditionId(condition.id)}>
              <ConditionalTooltip title={name} visible={name.length > 30}>
                <ClippedConditionName>
                  {name} (
                  <TranslatedEnum
                    value={conditionCategory}
                    enumValues={PROGRAM_REGISTRY_CONDITION_CATEGORIES}
                  />
                  )
                </ClippedConditionName>
              </ConditionalTooltip>
            </Condition>
          );
        })}
      </ScrollBody>
      <UpdateConditionFormModal
        open={updateModalIsOpen}
        onClose={() => setSelectedConditionId(null)}
        condition={selectedCondition}
      />
    </Container>
  );
};
