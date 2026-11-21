import styled from 'styled-components';
import { Button } from '@material-ui/core';
import { Colors } from '../../constants';

export const PrintActionButton = styled(Button)`
  font-weight: 500;
  text-transform: none;
  text-decoration: underline;
  color: ${Colors.primary};
  margin-top: auto;
  margin-bottom: auto;
  /* Keep each label on one line and let the pair use the spacer column beside it, rather than
     wrapping to two lines as the search bar's grid column narrows. */
  white-space: nowrap;
  flex-shrink: 0;
  &:hover {
    text-decoration: underline;
  }
  &.Mui-disabled {
    pointer-events: auto;
  }

  .MuiSvgIcon-root {
    font-size: 18px;
  }
`;
