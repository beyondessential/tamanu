import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { Paper } from '../../components';
import { Colors } from '../../constants';

export const ProgramsPane = styled(Paper)`
  background: white;
  padding: 30px;
  max-width: 700px;
  min-width: 500px;
  margin: 50px auto;
  border-radius: 3px;
`;

export const ProgramsPaneHeader = styled.div`
  padding: 30px;
  margin: -30px -30px 30px -30px;
  border-bottom: 1px solid ${Colors.softOutline};
  &::first-letter {
    text-transform: uppercase;
  }
`;

export const ProgramsPaneHeading = styled(Typography)`
  font-weight: 500;
  font-size: 18px;
`;
