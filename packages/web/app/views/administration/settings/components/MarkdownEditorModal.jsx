import React from 'react';
import styled from 'styled-components';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/theme-eclipse';
import 'ace-builds/src-noconflict/theme-dawn';

import { Modal } from '../../../../components/Modal';
import { Colors } from '../../../../constants';

const THEMES = {
  VIEW: 'dawn',
  EDIT: 'eclipse',
};

const Title = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const Category = styled.div`
  color: ${Colors.midText};
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
`;

const Description = styled.div`
  font-size: 14px;
  margin-bottom: 12px;
  color: ${Colors.midText};
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 12rem);
`;

const EditorContainer = styled.div`
  flex: 1;
  min-height: 240px;
  width: 100%;
`;

const StyledMarkdownEditor = styled(AceEditor)`
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
`;

export const MarkdownEditorModal = React.memo(
  ({ open, onClose, title, category, description, value, onChange, readOnly }) => (
    <Modal
      open={open}
      onClose={onClose}
      width="lg"
      title={
        <Title data-testid="markdowneditormodal-title">
          <span>{title}</span>
          {category && <Category data-testid="markdowneditormodal-category">{category}</Category>}
        </Title>
      }
      data-testid="markdowneditormodal-modal"
    >
      <ModalBody data-testid="markdowneditormodal-body">
        {description && (
          <Description data-testid="markdowneditormodal-desc">{description}</Description>
        )}
        <EditorContainer data-testid="markdowneditormodal-editor-wrap">
          <StyledMarkdownEditor
            name="settings-markdown-modal-editor"
            mode="markdown"
            theme={readOnly ? THEMES.VIEW : THEMES.EDIT}
            width="100%"
            height="100%"
            value={value ?? ''}
            onChange={onChange}
            readOnly={readOnly}
            showPrintMargin={false}
            showLineNumbers={false}
            highlightActiveLine={false}
            wrapEnabled
            fontSize={15}
            setOptions={{
              showLineNumbers: false,
              showGutter: false,
              cursorStyle: 'slim',
            }}
            editorProps={{ $blockScrolling: true }}
            data-testid="markdowneditormodal-textarea"
          />
        </EditorContainer>
      </ModalBody>
    </Modal>
  ),
);
