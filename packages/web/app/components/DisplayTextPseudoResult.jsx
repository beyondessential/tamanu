import React from 'react';

import { InstructionField, TranslatedReferenceData } from '@tamanu/ui-components';
import styled from 'styled-components';

const StyledInstructionField = styled(InstructionField)`
  h2 {
    font: inherit;
  }
`;

/** Same as <SurveyQuestion> when given a `DisplayText` component, but with only necessary props. */
export function DisplayTextPseudoResult({ component, ...props }) {
  const {
    dataElement: { defaultText, id: dataElementId },
    detail: componentDetail,
    id: componentId,
    text: componentText,
  } = component;

  const label = componentText ? (
    <TranslatedReferenceData
      category="surveyScreenComponent.text"
      value={componentId}
      fallback={componentText}
    />
  ) : (
    <TranslatedReferenceData
      category="programDataElement"
      value={dataElementId}
      fallback={defaultText}
    />
  );

  const helperText = componentDetail ? (
    <TranslatedReferenceData
      category="surveyScreenComponent.detail"
      value={componentId}
      fallback={componentDetail}
    />
  ) : null;

  return <StyledInstructionField label={label} helperText={helperText} {...props} />;
}
