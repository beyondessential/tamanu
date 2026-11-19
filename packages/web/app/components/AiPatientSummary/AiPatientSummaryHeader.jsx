import React from 'react';
import styled from 'styled-components';
import { IconButton } from '@material-ui/core';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

import { Colors } from '../../constants';
import { Heading4 } from '../Typography';
import { TranslatedText } from '../Translation/TranslatedText';

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
`;

const SparkleIcon = styled(Sparkles)`
  color: ${Colors.secondary};
  width: 16px;
  height: 16px;
`;

const Title = styled(Heading4)`
  color: ${Colors.primary};
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
`;

const ToggleButton = styled(IconButton)`
  padding: 0;
  color: ${Colors.midText};
`;

export const AiPatientSummaryHeader = ({ isOpen, onToggle }) => (
  <Header onClick={onToggle}>
    <HeaderLeft>
      <SparkleIcon data-testid="sparkle-icon" />
      <Title>
        <TranslatedText stringId="ai.patientSummary.title" fallback="AI patient summary" />
      </Title>
    </HeaderLeft>
    <ToggleButton size="small" data-testid="ai-summary-toggle">
      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </ToggleButton>
  </Header>
);
