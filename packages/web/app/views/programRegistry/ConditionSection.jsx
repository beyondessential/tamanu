import React, { useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { Divider, ButtonBase } from '@material-ui/core';
import { PROGRAM_REGISTRY_CONDITION_CATEGORIES } from '@tamanu/constants';
import { Heading5, TranslatedText } from '../../components';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ConditionalTooltip } from '../../components/Tooltip';
import { Colors } from '../../constants';
import useOverflow from '../../hooks/useOverflow';
import {
  useTranslatedPatientProgramRegistryConditions,
  UpdateConditionFormModal,
} from '../../features/ProgramRegistry';
import { usePatientProgramRegistryConditionsQuery } from '../../api/queries';

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

export const ConditionSection = () => {
  const { patientId, programRegistryId } = useParams();
  const [selectedConditionId, setSelectedConditionId] = useState(null);
  const { data: conditionsData = [], isLoading } = usePatientProgramRegistryConditionsQuery(
    patientId,
    programRegistryId,
  );
  const translatedData = useTranslatedPatientProgramRegistryConditions(conditionsData);
  if (isLoading) {
    return <LoadingIndicator />;
  }

  const onConditionClick = conditionId => {
    setSelectedConditionId(conditionId);
  };

  const { openConditions, closedConditions } = getGroupedConditions(translatedData);
  const needsDivider = openConditions.length > 0 && closedConditions.length > 0;
  const selectedCondition = translatedData.find(({ id }) => id === selectedConditionId);
  const updateModalIsOpen = Boolean(selectedConditionId) && Boolean(selectedCondition);

  return (
    <Container>
      <Heading5 mt={0} mb={1}>
        <TranslatedText
          stringId="programRegistry.relatedConditions.title"
          fallback="Related conditions"
        />
      </Heading5>
      <ScrollBody>
        {openConditions.map(condition => (
          <ConditionComponent key={condition.id} condition={condition} onClick={onConditionClick} />
        ))}
        {needsDivider && <Divider variant="middle" />}
        {closedConditions.map(condition => (
          <ConditionComponent key={condition.id} condition={condition} onClick={onConditionClick} />
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
