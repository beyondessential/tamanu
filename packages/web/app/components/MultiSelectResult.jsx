import { TranslatedOption, TranslatedText } from '@tamanu/ui-components';
import React from 'react';
import styled from 'styled-components';

const EmptyState = styled.span`
  color: ${props => props.theme.palette.text.secondary};
  font-style: italic;
`;

const UnorderedList = styled.ul`
  list-style-position: inside;
  margin-block: 0;
  padding-inline-start: 0;
`;

export default function MultiSelectResult({ answerBody, dataElementId, ...props }) {
  let arr;
  try {
    arr = JSON.parse(answerBody);
  } catch {
    return answerBody;
  }

  if (!Array.isArray(arr)) return answerBody;

  if (arr.length === 0) {
    return (
      <EmptyState>
        <TranslatedText stringId="general.fallback.noSelection" fallback="No selection" />
      </EmptyState>
    );
  }

  return (
    <UnorderedList {...props}>
      {arr.map(element => (
        <li key={element}>
          <TranslatedOption
            referenceDataCategory="programDataElement"
            referenceDataId={dataElementId}
            value={element}
          />
        </li>
      ))}
    </UnorderedList>
  );
}
