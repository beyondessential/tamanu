import styled from 'styled-components';
import { Colors } from '../../constants';
import { ProgramsPaneHeader, ProgramsPaneHeading } from './ProgramsPane';

export const SurveyPaneHeader = styled(ProgramsPaneHeader)`
  background: ${props => props.theme.palette.primary.main};
  text-align: center;
`;

export const SurveyPaneHeading = styled(ProgramsPaneHeading)`
  color: ${Colors.white};
`;
