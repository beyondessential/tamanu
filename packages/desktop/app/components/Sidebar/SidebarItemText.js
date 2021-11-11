import ListItemText from '@material-ui/core/ListItemText';
import { grey } from '@material-ui/core/colors';
import styled from 'styled-components';

export const SidebarItemText = styled(ListItemText)`
  color: ${grey[100]};
  padding-left: 15px;
  font-size: 1.05rem;

  &::first-letter {
    text-transform: uppercase;
  }
`;
