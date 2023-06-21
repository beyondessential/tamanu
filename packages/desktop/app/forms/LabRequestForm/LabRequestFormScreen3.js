import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { Field } from '../../components';
import { Heading3, BodyText } from '../../components/Typography';
import {
  SampleDetailsField,
  SAMPLE_DETAILS_FIELD_PREFIX,
} from '../../views/labRequest/SampleDetailsField';

const StyledBodyText = styled(BodyText)`
  margin-bottom: 28px;
  white-space: pre-line;
`;

export const LabRequestFormScreen3 = props => {
  const {
    values,
    values: { requestFormType, labTestPanelId },
    setFieldValue,
    initialSamples,
    practitionerSuggester,
    specimenTypeSuggester,
    labSampleSiteSuggester,
  } = props;
  const setSamples = useCallback(
    sampleDetails => {
      setFieldValue('sampleDetails', sampleDetails);
    },
    [setFieldValue],
  );

  // Reset sample details field when loading step
  useEffect(() => {
    for (const key of Object.keys(values)) {
      if (key.startsWith(SAMPLE_DETAILS_FIELD_PREFIX)) {
        setFieldValue(key, null);
      }
    }
    // Don't want to have it executing every time value is changed, just when the screen is loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <Heading3 mb="12px">Sample details</Heading3>
      <StyledBodyText mb="28px" color="textTertiary">
        Please record details for the samples that have been collected. Otherwise leave blank and
        click ‘Finalise’.
      </StyledBodyText>
      <Field
        name="sampleDetails"
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
