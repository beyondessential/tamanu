import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { Colors } from '../../constants';

export const ProgramsPane = styled.div`
  background: white;
  padding: 30px;
  max-width: 100%;
  margin: 50px auto;
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
