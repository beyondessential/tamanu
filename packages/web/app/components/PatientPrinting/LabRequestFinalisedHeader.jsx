import React from 'react';
import styled from 'styled-components';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Heading3 } from '../Typography';
import { TranslatedText } from '../Translation';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 10px;

  h3 {
    font-size: 1rem;
  }
`;

const SuccessIcon = styled(CheckCircleOutlineIcon)`
  color: #47ca80;
  font-size: 24px;
  margin-bottom: 10px;
`;

export const LabRequestFinalisedHeader = () => (
  <Wrapper>
    <SuccessIcon />
    <Heading3>
      <TranslatedText
        stringId="lab.requestSummary.finalisedHeading"
        fallback="Your lab request has been finalised."
      />
    </Heading3>
  </Wrapper>
);
