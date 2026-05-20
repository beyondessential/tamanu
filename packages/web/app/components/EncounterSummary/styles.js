import styled from 'styled-components';
import EditIcon from '@mui/icons-material/Edit';
import { Sparkles } from 'lucide-react';

import { Button, TextButton } from '@tamanu/ui-components';

import { Colors } from '../../constants';
import { BodyText } from '../Typography';

export const Section = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  margin: 8px 0;
`;

export const SectionLabel = styled.label`
  color: ${Colors.darkText};
  font-size: 14px;
  font-weight: 500;
  grid-column: 1;
`;

export const SectionAction = styled.div`
  grid-column: 2;
  justify-self: end;
  align-self: end;
`;

export const Body = styled.div`
  grid-column: 1 / -1;
`;

export const GenerateButton = styled(Button)`
  padding: 8px 16px;
  background: ${Colors.background};
  color: ${Colors.primary};
  border: 1px solid ${Colors.primary};
  font-weight: 500;
  text-transform: none;

  &:hover {
    background: ${Colors.background2};
  }

  .MuiButton-startIcon {
    margin-right: 8px;
  }
`;

export const SparkleIcon = styled(Sparkles)`
  color: ${Colors.primary};
  width: 18px;
  height: 18px;
`;

export const SummaryBox = styled.div`
  background: ${Colors.background};
  border: 1px solid ${Colors.softOutline};
  border-radius: 4px;
  padding: 16px;
`;

export const SummaryText = styled(BodyText)`
  color: ${Colors.darkestText};
  line-height: 22px;
  white-space: pre-wrap;
`;

export const SummaryFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 5px;
`;

export const Disclaimer = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${Colors.darkestText};
`;

export const DiscardButton = styled(TextButton)`
  color: ${Colors.darkText};
  font-size: 13px;
  padding: 0;
  text-transform: none;
  min-width: 0;
  text-decoration: underline;

  &:hover {
    text-decoration: underline;
    background: transparent;
  }

  .MuiButton-startIcon {
    margin-right: 4px;
  }

  & .MuiButton-iconSizeMedium > *:first-of-type {
    font-size: 16px;
  }
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${Colors.background2};
  border: 1px solid ${Colors.softOutline};
  border-radius: 4px;
  min-height: 96px;
`;

export const ErrorText = styled(BodyText)`
  color: ${Colors.alert};
  font-size: 13px;
`;

export const StyledEditIcon = styled(EditIcon)`
  color: ${Colors.primary};
`;

export const EditTextarea = styled.textarea`
  width: 100%;
  min-height: 140px;
  padding: 12px;
  border: 1px solid ${Colors.primary};
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  line-height: 22px;
  color: ${Colors.darkestText};
  resize: vertical;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: ${Colors.primary};
    box-shadow: 0 0 0 1px ${Colors.primary};
  }
`;

export const EditActions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
`;

export const CancelButton = styled(TextButton)`
  font-size: 14px;
  padding: 4px 8px;
  text-transform: none;
  min-width: 0;
`;

export const SaveButton = styled(Button)`
  font-size: 14px;
  padding: 8px 16px;
  text-transform: none;
  min-width: 0;
`;

export const EditedText = styled.span`
  margin-left: 8px;
  font-style: italic;
`;
