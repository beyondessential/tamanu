import React, { useState } from 'react';
import styled from 'styled-components';
import { OutlinedButton } from '../../../components';
import { QueryEditor } from './QueryEditor';

const Container = styled.div`
  display: flex;
  padding: 20px;
  align-items: flex-start;
`;

export const NewReportView = () => {
  const [showSqlEditor, setShowSqlEditor] = useState(false);
  const handleUpdate = () => {};
  const handleCloseSqlEditor = () => setShowSqlEditor(false);

  return (
    <Container>
      <OutlinedButton onClick={() => setShowSqlEditor(true)}>Edit SQL</OutlinedButton>
      <QueryEditor
        title="Edit Query"
        initialValue=""
        onSubmit={handleUpdate}
        open={showSqlEditor}
        onClose={handleCloseSqlEditor}
      />
    </Container>
  );
};
