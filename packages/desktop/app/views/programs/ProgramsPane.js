import styled from 'styled-components';
import { Colors } from '../../constants';
import { Typography } from '@material-ui/core';

export const ProgramsPane = styled.div`
  background: white;
  padding: 30px;
  max-width: 700px;
  margin: 24px auto;
`;

export const ProgramsPaneHeader = styled.div`
  padding: 30px;
  background: ${Colors.primary};
  margin: -30px -30px 30px -30px;

  &::first-letter {
    text-transform: uppercase;
  }
`;

export const ProgramsPaneHeading = styled(Typography)`
  font-weight: 500;
  font-size: 18px;
  color: ${Colors.secondary};
`;
