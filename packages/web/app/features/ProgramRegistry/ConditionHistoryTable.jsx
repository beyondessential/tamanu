import React from 'react';
import styled from 'styled-components';
import { DEPRECATED_PRCC_LABELS } from '@tamanu/constants';
import {
  TranslatedEnum,
  TranslatedReferenceData,
  TranslatedText,
} from '@tamanu/ui-components';
import { DateDisplay, Heading5 } from '../../components';
import { useProgramRegistryConditionCategoriesQuery } from '../../api/queries/usePatientProgramRegistryConditionsQuery';
import { Colors } from '../../constants';

const HistorySection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: ${Colors.white};
  padding: 1rem;
  border-radius: 3px;
  border: 1px solid ${Colors.outline};
  margin-bottom: 2rem;
`;

const HistoryItem = styled.div`
  font-size: 14px;
  line-height: 18px;
  flex: 1;
`;

const HistoryItemRow = styled.div`
  display: flex;
`;

const HistoryItemLabel = styled.div`
  color: ${Colors.darkText};
  margin-right: 1ch;
`;

const HistoryItemValue = styled.div`
  color: ${Colors.darkestText};
  font-weight: 500;
`;

const SmallText = styled.div`
  color: ${Colors.midText};
  font-size: 11px;
  span {
    margin-right: 1ch;
  }
`;

const ConditionCategoryDisplay = ({ data, conditionCategories }) => {
  if (data?.programRegistryConditionCategoryId) {
    const conditionCategory = conditionCategories.find(
      category => category.id === data.programRegistryConditionCategoryId,
    );
    return (
      <TranslatedReferenceData
        value={data.programRegistryConditionCategoryId}
        fallback={conditionCategory?.name}
        category="programRegistryConditionCategory"
      />
    );
  }

  // For backwards compatibility with the old enum values
  return <TranslatedEnum value={data.conditionCategory} enumValues={DEPRECATED_PRCC_LABELS} />;
};

export const ConditionHistoryTable = ({ historyData = [], programRegistryId = '' }) => {
  const { data: conditionCategories = [] } = useProgramRegistryConditionCategoriesQuery(
    programRegistryId,
  );
  return (
    <>
      <Heading5 mb={1} mt={1}>
        <TranslatedText
          stringId="programRegistry.conditionCategoryHistory.title"
          fallback="Condition category history"
        />
      </Heading5>
      <HistorySection>
        {historyData.map(entry => (
          <HistoryItem key={entry.id}>
            <HistoryItemRow>
              <HistoryItemLabel>
                <TranslatedText
                  stringId="programRegistry.conditionCategoryHistory.categoryLabel"
                  fallback="Category:"
                />
              </HistoryItemLabel>
              <HistoryItemValue>
                <ConditionCategoryDisplay
                  data={entry.data}
                  conditionCategories={conditionCategories}
                />
              </HistoryItemValue>
            </HistoryItemRow>
            {entry.data.reasonForChange && (
              <HistoryItemRow>
                <HistoryItemLabel>
                  <TranslatedText
                    stringId="programRegistry.conditionCategoryHistory.reasonForChangeLabel"
                    fallback="Reason for change:"
                  />
                </HistoryItemLabel>
                <HistoryItemValue>{entry.data.reasonForChange}</HistoryItemValue>
              </HistoryItemRow>
            )}
            <SmallText>
              <span>{entry.clinician.displayName}</span>
              <DateDisplay date={entry.date} timeFormat="default" />
            </SmallText>
          </HistoryItem>
        ))}
      </HistorySection>
    </>
  );
};
