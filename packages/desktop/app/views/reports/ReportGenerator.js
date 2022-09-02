import React, { useState } from 'react';
import { green } from '@material-ui/core/colors';
import styled from 'styled-components';
import { Button, PageContainer, TopBar, ContentPane } from '../../components';
import { Colors } from '../../constants';
import { ReportGeneratorForm } from './ReportGeneratorForm';

const ContentContainer = styled.div`
  background: ${props => (props.submitted ? green[50] : Colors.white)};
  padding: 32px 30px;
  border: 1px solid ${Colors.outline};
`;

export const ReportGenerator = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitted = () => setSubmitted(true);
  const handleReset = () => setSubmitted(false);

  return (
    <PageContainer>
      <TopBar title="Report generator" />
      <ContentPane>
        <ContentContainer submitted={submitted}>
          {submitted ? (
            <Button variant="contained" color="primary" onClick={handleReset}>
              Generate another report
            </Button>
          ) : (
            <ReportGeneratorForm onSuccessfulSubmit={handleSubmitted} />
          )}
        </ContentContainer>
      </ContentPane>
    </PageContainer>
  );
};
