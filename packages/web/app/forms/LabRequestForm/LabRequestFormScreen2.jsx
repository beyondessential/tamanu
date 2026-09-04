import React from 'react';
import styled from 'styled-components';
import { BodyText } from '../../components/Typography';
import { SampleDetailsTable } from '../../views/labRequest/SampleDetailsTable';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const StyledBodyText = styled(BodyText)`
  margin-bottom: 28px;
  white-space: pre-line;
`;

export const LabRequestFormScreen2 = ({
  initialSamples,
  practitionerSuggester,
  specimenTypeSuggester,
  labSampleSiteSuggester,
}) => (
  <div style={{ gridColumn: '1 / -1' }}>
    <StyledBodyText color="textTertiary" data-testid="styledbodytext-ic37">
      <TranslatedText
        stringId="lab.sampleDetails.instruction"
        fallback="Please record details for the samples that have been collected. Otherwise leave blank and click ‘Finalise’."
        data-testid="translatedtext-aob4"
      />
    </StyledBodyText>
    <SampleDetailsTable
      samples={initialSamples}
      practitionerSuggester={practitionerSuggester}
      specimenTypeSuggester={specimenTypeSuggester}
      labSampleSiteSuggester={labSampleSiteSuggester}
      data-testid="sampledetailstable-osvy"
    />
  </div>
);
