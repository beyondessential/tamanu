import React, { useState } from 'react';
import styled from 'styled-components';
import { useApi } from '../../../../api';
import { FormGrid, OutlinedButton } from '../../../../components';

const InnerContainer = styled.div`
  padding: 20px;
`;

const StyledButton = styled(OutlinedButton)`
  margin-top: 30px
`;

export const ReportsExportView = () => {
  const api = useApi();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    setSubmitting(true);
    setError(null);
    try {
      // const report = await api.post('admin/reports', {file, name})
      console.log(report)
    } catch(err) {
      console.log(err)
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <InnerContainer>
      <FormGrid columns={1}>

      </FormGrid>
      <StyledButton onClick={handleSubmit} disabled={submitting}>Export</StyledButton>
    </InnerContainer>
  );
}
