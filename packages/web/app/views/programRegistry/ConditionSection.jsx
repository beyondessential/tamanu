import React from 'react';
import styled from 'styled-components';
import { sortBy } from 'lodash';
import { ButtonBase, Divider } from '@material-ui/core';
import { PROGRAM_REGISTRY_CONDITION_CATEGORIES } from '@tamanu/constants';
import { Heading5, TranslatedText } from '../../components';
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
  border: 1px solid ${Colors.outline};
  padding: 5px 0;
  overflow: auto;
`;

const Condition = styled(ButtonBase)`
  width: 100%;
  text-align: left;
  padding: 7px 12px;
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
  width: 100%;
`;

const ConditionCategory = styled.span`
  color: ${Colors.midText};
`;

const getGroupedConditions = (conditions) => {
  const openConditions = [];
  const closedConditions = [];

  conditions.forEach(condition => {
    if (condition.conditionCategory === PROGRAM_REGISTRY_CONDITION_CATEGORIES.recordedInError) {
      return;
    }

    if ([
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.resolved,
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.disproven,
    ].includes(condition.conditionCategory)) {
      closedConditions.push(condition);
      return;
    }

    openConditions.push(condition);
  });

  return { openConditions, closedConditions };
};

const ConditionMapperFn = (condition) => {
  const { programRegistryCondition, conditionCategory } = condition;
  const { name } = programRegistryCondition;
  const fullText = `${name} (${conditionCategory})`;
  return (
    <ConditionalTooltip title={fullText} visible={fullText.length > 65} key={condition.id}>
      <Condition>
        <ClippedConditionName>
          {name} <ConditionCategory>({conditionCategory})</ConditionCategory>
        </ClippedConditionName>
      </Condition>
    </ConditionalTooltip>
  );
};

export const ConditionSection = ({ patientProgramRegistration }) => {
  const { data: conditions, isLoading } = usePatientProgramRegistryConditionsQuery(
    patientProgramRegistration.patientId,
    patientProgramRegistration.programRegistryId,
  );

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (conditions.data.length === 0) {
    return null;
  }

  const sortedData = sortBy(conditions.data, c => c?.programRegistryCondition?.name);
  const { openConditions, closedConditions } = getGroupedConditions(sortedData);
  const needsDivider = openConditions.length > 0 && closedConditions.length > 0;

  return (
    <Container>
      <Heading5 mt={0} mb={1}>
        <TranslatedText
          stringId="patientProgramRegistry.relatedConditions.title"
          fallback="Related conditions"
        />
      </Heading5>
      <ScrollBody>
        {openConditions.map(ConditionMapperFn)}
        {needsDivider && <Divider variant="middle" />}
        {closedConditions.map(ConditionMapperFn)}
      </ScrollBody>
    </Container>
  );
};
