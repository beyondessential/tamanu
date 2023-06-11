import React, { useState } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import styled from 'styled-components';
import { Card } from '@material-ui/core';
import { BodyText, ConfirmCancelRow, Modal } from '../../../components';
import { Colors } from '../../../constants';

const EditorContainer = styled.div`
  max-height: 52vh;
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

const StyledCard = styled(Card)`
  padding: 15px;
`;

const codeEditorStyles = {
  fontSize: 12,
  fontFamily: 'Fira Code',
};

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
      <StyledCard>
        <EditorContainer>
          <CodeEditor
            value={value}
            language="sql"
            placeholder="Please enter your query here"
            onChange={handleChange}
            data-color-mode="dark"
            style={codeEditorStyles}
          />
        </EditorContainer>
      </StyledCard>
      <BodyText color="textTertiary" marginTop={2} marginBottom={2}>
        Pressing confirm will update the <b>query</b> key in the json editor. If you wish to persist
        this change you must click <b>Save new version</b> after confirming changes.
      </BodyText>
      <ConfirmCancelRow onConfirm={handleSubmit} />
    </Modal>
  );
};
