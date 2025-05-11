import React, { useState } from 'react';
import styled from 'styled-components';
import { sortBy } from 'lodash';
import { Divider, ButtonBase } from '@material-ui/core';
import {
  PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
} from '@tamanu/constants';
import { getReferenceDataStringId, Heading5, TranslatedText } from '../../components';
import { usePatientProgramRegistryConditionsQuery } from '../../api/queries';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ConditionalTooltip } from '../../components/Tooltip';
import { Colors } from '../../constants';
import useOverflow from '../../hooks/useOverflow';
import { useTranslation } from '../../contexts/Translation';
import { UpdateConditionFormModal } from '../../features/ProgramRegistry';

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

const getGroupedConditions = conditions => {
  const openConditions = [];
  const closedConditions = [];

  conditions.forEach(condition => {
    if (condition.conditionCategory === PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR) {
      return;
    }

    if (
      [
        PROGRAM_REGISTRY_CONDITION_CATEGORIES.RESOLVED,
        PROGRAM_REGISTRY_CONDITION_CATEGORIES.DISPROVEN,
      ].includes(condition.conditionCategory)
    ) {
      closedConditions.push(condition);
      return;
    }

    openConditions.push(condition);
  });

  return { openConditions, closedConditions };
};

const ConditionComponent = ({ condition, onClick }) => {
  const { translatedName, translatedCategory } = condition;
  const [ref, isOverflowing] = useOverflow();
  return (
    <ConditionalTooltip title={`${translatedName} (${translatedCategory})`} visible={isOverflowing}>
      <Condition onClick={() => onClick(condition.id)}>
        <ClippedConditionName ref={ref}>
          {translatedName} <ConditionCategory>({translatedCategory})</ConditionCategory>
        </ClippedConditionName>
      </Condition>
    </ConditionalTooltip>
  );
};

export const ConditionSection = ({ registrationId }) => {
  const { getTranslation, getEnumTranslation } = useTranslation();
  const [selectedConditionId, setSelectedConditionId] = useState(null);
  const { data: conditions = [], isLoading } = usePatientProgramRegistryConditionsQuery(
    registrationId,
  );

  if (isLoading) {
    return <LoadingIndicator />;
  }

  const onConditionClick = conditionId => {
    setSelectedConditionId(conditionId);
  };

  const translatedData = conditions.map(condition => {
    const { programRegistryCondition, conditionCategory } = condition;
    const { id, name } = programRegistryCondition;
    const translatedName = getTranslation(
      getReferenceDataStringId(id, 'programRegistryCondition'),
      name,
    );

    const translatedCategory = getEnumTranslation(
      PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
      conditionCategory,
    );
    return { ...condition, translatedName, translatedCategory };
  });
  const sortedData = sortBy(translatedData, c => c.translatedName);
  const { openConditions, closedConditions } = getGroupedConditions(sortedData);
  const needsDivider = openConditions.length > 0 && closedConditions.length > 0;
  const selectedCondition = conditions.find(({ id }) => id === selectedConditionId);
  const updateModalIsOpen = Boolean(selectedConditionId) && Boolean(selectedCondition);

  return (
    <Container>
      <Heading5 mt={0} mb={1}>
        <TranslatedText
          stringId="programRegistry.relatedConditions.title"
          fallback="Related conditions"
          data-testid="translatedtext-tezx"
        />
      </Heading5>
      <ScrollBody>
        {openConditions.map(condition => (
          <ConditionComponent key={condition.id} condition={condition} onClick={onConditionClick} data-testid={`condition-component-open-${index}`} />
        ))}
        {needsDivider && <Divider variant="middle" />}
        {closedConditions.map(condition => (
          <ConditionComponent key={condition.id} condition={condition} onClick={onConditionClick} data-testid={`conditional-component-closed-${index}`} />
        ))}
      </ScrollBody>
      <UpdateConditionFormModal
        open={updateModalIsOpen}
        onClose={() => setSelectedConditionId(null)}
        condition={selectedCondition}
      />
    </Container>
  );
};
