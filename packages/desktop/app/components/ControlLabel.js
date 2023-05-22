import styled from 'styled-components';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { Colors } from '../constants';

export const ControlLabel = styled(FormControlLabel)`
  margin: 0;
  padding: 10px 12px 10px 10px;
  border: 1px solid ${Colors.outline};
  justify-content: center;
  background: ${Colors.white};

  span {
    font-size: 14px;
    line-height: 16px;
    padding: 0;
  }

  .MuiFormControlLabel-label {
    padding: 0 0 0 3px;
  }

  :not(:last-of-type) {
    border-right: none;
  }

  :first-of-type {
    border-radius: 3px 0 0 3px;
  }

  :last-of-type {
    border-radius: 0 3px 3px 0;
  }
`;
