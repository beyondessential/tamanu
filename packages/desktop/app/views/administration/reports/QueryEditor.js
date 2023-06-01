import React, { useState } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import styled from 'styled-components';
import { Card } from '@material-ui/core';
import { ConfirmCancelRow, Modal } from '../../../components';
import { Colors } from '../../../constants';

const EditorContainer = styled.div`
  max-height: 60vh;
  margin: 0 auto;
  overflow: auto;
  ::-webkit-scrollbar {
    width: 20px;
  }

  ::-webkit-scrollbar-track {
    background-color: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: ${Colors.softText};
    border-radius: 20px;
    border: 6px solid transparent;
    background-clip: content-box;
  }
`;

export const QueryEditor = ({ open, onClose, initialValue = '', onSubmit, title }) => {
  const [value, setValue] = useState(initialValue);

  const handleChange = event => setValue(event.target.value);
  const handleClose = () => {
    setValue(initialValue);
    onClose();
  };
  const handleSubmit = () => {
    onSubmit(value);
    onClose();
  };

  return (
    <Modal width="md" title={title} open={open} onClose={handleClose}>
      <Card style={{ padding: 15 }}>
        <EditorContainer>
          <CodeEditor
            value={value}
            language="sql"
            placeholder="Please enter your query here"
            onChange={handleChange}
            data-color-mode="dark"
            style={{
              fontSize: 12,
              fontFamily: 'Fira Code',
            }}
          />
        </EditorContainer>
      </Card>
      <ConfirmCancelRow onConfirm={handleSubmit} />
    </Modal>
  );
};
