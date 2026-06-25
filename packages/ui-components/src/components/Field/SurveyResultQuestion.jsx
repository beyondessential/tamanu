import Typography from '@mui/material/Typography';
import React from 'react';
import styled from 'styled-components';
import { SurveyResultBadge } from './SurveyResultBadge';

const Wrapper = styled.div`
  align-items: last baseline;
  column-gap: 2rem;
  display: grid;
  grid-template-columns: 1fr auto;
  margin-block-end: 10px;
`;

export default function SurveyResultQuestion({ component, label, text, ...props }) {
  return (
    <Wrapper {...props}>
      <Typography>{text ?? label}</Typography>
      {component?.detail && <SurveyResultBadge resultText={component.detail} />}
    </Wrapper>
  );
}
