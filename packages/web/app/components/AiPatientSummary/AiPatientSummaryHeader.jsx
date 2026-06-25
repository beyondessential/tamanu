import React from 'react';
import styled from 'styled-components';
import { IconButton } from '@material-ui/core';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Sparkles } from 'lucide-react';

import { Colors } from '../../constants';
import { Heading4 } from '../Typography';
import { TranslatedText } from '../Translation/TranslatedText';

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 25px;
  cursor: pointer;
  user-select: none;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SparkleIcon = styled(Sparkles)`
  color: ${Colors.metallicYellow};
  width: 20px;
  height: 20px;
`;

const Title = styled(Heading4)`
  color: ${Colors.primary};
  margin: 0;
`;

export const AiPatientSummaryHeader = ({ isOpen, onToggle }) => (
  <Header onClick={onToggle}>
    <HeaderLeft>
      <SparkleIcon data-testid="sparkle-icon" />
      <Title>
        <TranslatedText stringId="ai.patientSummary.title" fallback="AI patient summary" />
      </Title>
    </HeaderLeft>
    <IconButton size="small" data-testid="ai-summary-toggle">
      {isOpen ? <ExpandLess /> : <ExpandMore />}
    </IconButton>
  </Header>
);
