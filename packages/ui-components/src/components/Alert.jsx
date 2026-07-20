import MuiAlert, { alertClasses } from '@mui/material/Alert';
import styled from 'styled-components';

const Alert = styled(MuiAlert)`
  &.${alertClasses.root} {
    border: 1px solid
      ${({ color, theme, severity = 'info' }) => theme.palette[color ?? severity].main};
  }
`;

export default Alert;
