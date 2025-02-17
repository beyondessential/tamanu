import React from 'react';
import styled from 'styled-components';
import { sortBy } from 'lodash';
import { ButtonBase } from '@material-ui/core';
import { Heading5 } from '../../components/Typography';
import { usePatientProgramRegistryConditionsQuery } from '../../api/queries';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ConditionalTooltip } from '../../components/Tooltip';
import { Colors } from '../../constants';

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

export const ConditionSection = ({ patientProgramRegistration }) => {
  const { data: conditions, isLoading } = usePatientProgramRegistryConditionsQuery(
    patientProgramRegistration.patientId,
    patientProgramRegistration.programRegistryId,
  );

  if (isLoading) {
    return <LoadingIndicator />;
  }

  const data = sortBy(conditions.data, (c) => c?.programRegistryCondition?.name);

  return (
    <Container>
      <Heading5 mt={0} mb={1}>
        Related conditions
      </Heading5>
      <ScrollBody>
        {data?.map((condition) => {
          const { programRegistryCondition, conditionCategory } = condition;
          const { name } = programRegistryCondition;
          return (
            <Condition key={condition.id}>
              <ConditionalTooltip title={name} visible={name.length > 30}>
                <ClippedConditionName>
                  {name} ({conditionCategory})
                </ClippedConditionName>
              </ConditionalTooltip>
            </Condition>
          );
        })}
      </ScrollBody>
    </Container>
  );
};
