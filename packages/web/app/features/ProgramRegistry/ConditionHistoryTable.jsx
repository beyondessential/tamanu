import React from 'react';
import styled from 'styled-components';
import { Colors } from '../../constants';
import { DateDisplay, Heading5, TranslatedReferenceData, TranslatedText } from '../../components';

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

export const ConditionHistoryTable = ({ historyData = [] }) => {
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
                <TranslatedReferenceData
                  value={entry.data.programRegistryConditionCategory.id}
                  fallback={entry.data.programRegistryConditionCategory.name}
                  category="programRegistryConditionCategory"
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
              <DateDisplay date={entry.date} showTime />
            </SmallText>
          </HistoryItem>
        ))}
      </HistorySection>
    </>
  );
};
