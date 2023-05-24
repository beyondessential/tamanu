import React, { useCallback } from 'react';
import styled from 'styled-components';
import { Field } from '../../components';
import { Heading3, BodyText } from '../../components/Typography';
import { CategoryTestSampleField } from '../../views/labRequest/CategoryTestSample';

const StyledBodyText = styled(BodyText)`
  margin-bottom: 28px;
  white-space: pre-line;
`;

export const LabRequestFormScreen3 = props => {
  const {
    values: { requestFormType, labTestPanelId },
    setFieldValue,
    categories,
    practitionerSuggester,
    specimenTypeSuggester,
    labSampleSiteSuggester,
  } = props;

  const handleClearPanel = () => {
    setFieldValue('labTestPanelId', undefined);
  };

  const setCategorySample = useCallback(
    samples => {
      setFieldValue('categorySamples', samples);
    },
    [setFieldValue],
  );

  return (
    <>
      <div style={{ gridColumn: '1 / -1' }}>
        <Heading3 mb="12px">Sample details</Heading3>
        <StyledBodyText mb="28px" color="textTertiary">
          Please record details for the samples that have been collected. Otherwise leave blank and
          click ‘Finalise’.
        </StyledBodyText>
        <Field
          name="categorySamples"
          onClearPanel={handleClearPanel}
          component={CategoryTestSampleField}
          onCategorySampleChange={setCategorySample}
          requestFormType={requestFormType}
          labTestPanelId={labTestPanelId}
          categories={categories}
          practitionerSuggester={practitionerSuggester}
          specimenTypeSuggester={specimenTypeSuggester}
          labSampleSiteSuggester={labSampleSiteSuggester}
          required
          {...props}
        />
      </div>
    </>
  );
};
