import _Alert, { alertClasses } from '@mui/material/Alert';
import styled from 'styled-components';

/**
 * Not meaningfully different from {@link _Alert}. Same handling of `color`, `severity` props. Just
 * adds border a border to the `standard` variant. (`outlined` variant has transparent background.)
 */
const Alert = styled(_Alert)`
  &.${alertClasses.standard} {
    border: 1px solid
      ${({ color, theme, severity = 'success' }) => theme.palette[color ?? severity].main};
  }
`;

export default Alert;
