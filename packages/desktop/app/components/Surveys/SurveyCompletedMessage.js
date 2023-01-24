import React from 'react';
import styled from 'styled-components';
import Alert from '@material-ui/lab/Alert';
import { Button } from '../Button';
import { ButtonRow } from '../ButtonRow';

const StyledButtonRow = styled(ButtonRow)`
  margin-top: 24px;
`;

const StyledAlert = styled(Alert)`
  margin: 15px 0;
`;

export const SurveyCompletedMessage = React.memo(({ onResetClicked }) => (
  <div>
    <StyledAlert severity="success">Your response has been successfully submitted.</StyledAlert>
    <StyledButtonRow>
      <Button variant="contained" color="primary" onClick={onResetClicked}>
        New survey
      </Button>
    </StyledButtonRow>
  </div>
));
