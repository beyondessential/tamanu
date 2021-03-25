import { Grid, Typography } from '@material-ui/core';
import { green } from '@material-ui/core/colors';
import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, PageContainer, TopBar } from '../../components';
import { MUI_SPACING_UNIT } from '../../constants';
import { ReportGeneratorForm } from './ReportGeneratorForm';

const PageContent = styled.div`
  padding: 24px;
`;

const SuccessMessageContainer = styled(Grid)`
  padding: ${MUI_SPACING_UNIT * 2}px ${MUI_SPACING_UNIT * 3}px;
  background-color: ${green[50]};
`;

const SuccessfulSubmitMessage = ({ resetForm }) => {
  return (
    <SuccessMessageContainer>
      <Button variant="outlined" color="primary" onClick={resetForm}>
        Generate another report
      </Button>
    </SuccessMessageContainer>
  );
};

export const ReportGenerator = () => {
  const [formState, setFormState] = useState('initial');

  return (
    <PageContainer>
      <TopBar title="Report Generator" />
      <PageContent>
        {formState === 'initial' && (
          <ReportGeneratorForm
            onSuccessfulSubmit={() => {
              setFormState('submitted');
            }}
          />
        )}
        {formState === 'submitted' && (
          <SuccessfulSubmitMessage
            resetForm={() => {
              setFormState('initial');
            }}
          />
        )}
      </PageContent>
    </PageContainer>
  );
};
