import React, { useState } from 'react';
import styled from 'styled-components';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/theme-textmate';

import { ConfirmCancelRow, TranslatedText, Modal, TAMANU_COLORS } from '@tamanu/ui-components';

const Title = styled.h3`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin: 0;
`;

const Category = styled.p`
  color: ${TAMANU_COLORS.midText};
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  margin: 0;
`;

const Description = styled.p`
  font-size: 14px;
  margin: 0;
  color: ${TAMANU_COLORS.midText};
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
`;

const EditorContainer = styled.div`
  height: clamp(240px, calc(100dvh - 320px), 520px);
  width: 100%;
`;  

const StyledMarkdownEditor = styled(AceEditor)`
  border: 1px solid ${TAMANU_COLORS.outline};
  border-radius: 4px;

  .ace_scroller {
    padding: 12px 10px;
  }
`;

const StyledConfirmCancelRow = styled(ConfirmCancelRow)`
  margin-top: 0;

  > button:last-child {
    display: ${props => (props.$hideConfirm ? 'none' : 'inline-flex')};
  }
`;

const BottomPinnedRow = styled.div`
  padding-block: 1rem 1.25rem;
  padding-inline: 32px;
  border-block-start: 1px solid ${TAMANU_COLORS.outline};
  background-color: ${TAMANU_COLORS.background};
`;

const EDITOR_OPTIONS = {
  showLineNumbers: false,
  showGutter: false,
  cursorStyle: 'slim',
};

const EDITOR_PROPS = { $blockScrolling: true };

const getStringValue = value => (value == null ? '' : String(value));

export const MarkdownEditorModal = ({
  open,
  onClose,
  title,
  category,
  description,
  value,
  onSave,
  readOnly,
}) => {
  const currentValue = getStringValue(value);
  const [draft, setDraft] = useState(currentValue);
  const hasDraftChange = draft !== currentValue;

  const handleConfirm = () => {
    onSave(draft);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="lg"
      cornerExitButton={false}
      fixedBottomRow
      bottomRowContent={
        <BottomPinnedRow data-testid="markdowneditormodal-footer">
          <StyledConfirmCancelRow
            onCancel={onClose}
            onConfirm={handleConfirm}
            confirmDisabled={!hasDraftChange}
            cancelText={
              readOnly ? (
                <TranslatedText stringId="general.action.close" fallback="Close" />
              ) : (
                <TranslatedText
                  stringId="general.action.discardChanges"
                  fallback="Discard changes"
                />
              )
            }
            $hideConfirm={readOnly}
          />
        </BottomPinnedRow>
      }
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
            theme="textmate"
            width="100%"
            height="100%"
            value={draft}
            onChange={setDraft}
            readOnly={readOnly}
            showPrintMargin={false}
            showLineNumbers={false}
            highlightActiveLine={false}
            wrapEnabled
            fontSize={13}
            setOptions={EDITOR_OPTIONS}
            editorProps={EDITOR_PROPS}
            onLoad={editor => editor.resize()}
            data-testid="markdowneditormodal-textarea"
          />
        </EditorContainer>
      </ModalBody>
    </Modal>
  );
};
