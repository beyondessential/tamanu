import React, { useCallback } from 'react';
import styled from 'styled-components';
import { Field } from '../../components';
import { Heading3, BodyText } from '../../components/Typography';
import { SampleDetailsField } from '../../views/labRequest/SampleDetailsField';

const StyledBodyText = styled(BodyText)`
  margin-bottom: 28px;
  white-space: pre-line;
`;

export const LabRequestFormScreen3 = props => {
  const {
    values: { requestFormType, labTestPanelId },
    setFieldValue,
    initialSamples,
    practitionerSuggester,
    specimenTypeSuggester,
    labSampleSiteSuggester,
  } = props;

  const handleClearPanel = () => {
    setFieldValue('labTestPanelId', undefined);
  };

  const setSamples = useCallback(
    sampleDetails => {
      setFieldValue('sampleDetails', sampleDetails);
    },
    [setFieldValue],
  );

  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <Heading3 mb="12px">Sample details</Heading3>
      <StyledBodyText mb="28px" color="textTertiary">
        Please record details for the samples that have been collected. Otherwise leave blank and
        click ‘Finalise’.
      </StyledBodyText>
      <Field
        name="sampleDetails"
        onClearPanel={handleClearPanel}
        component={SampleDetailsField}
        onSampleChange={setSamples}
        requestFormType={requestFormType}
        labTestPanelId={labTestPanelId}
        initialSamples={initialSamples}
        practitionerSuggester={practitionerSuggester}
        specimenTypeSuggester={specimenTypeSuggester}
        labSampleSiteSuggester={labSampleSiteSuggester}
        required
        {...props}
      />
    </div>
  );
};
