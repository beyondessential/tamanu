import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/theme-textmate';

import { ConfirmCancelRow } from '@tamanu/ui-components';

import { Modal } from '../../../../components/Modal';
import { Colors } from '../../../../constants';

const Title = styled.h3`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin: 0;
`;

const Category = styled.p`
  color: ${Colors.midText};
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  margin: 0;
`;

const Description = styled.p`
  font-size: 14px;
  margin: 0;
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

const StyledConfirmCancelRow = styled(ConfirmCancelRow)`
  margin-top: 0;
`;

const BottomPinnedRow = styled.div`
  padding-block: 1rem 1.25rem;
  padding-inline: 32px;
  border-block-start: 1px solid ${Colors.outline};
  background-color: ${Colors.background};
`;

export const MarkdownEditorModal = React.memo(
  ({ open, onClose, title, category, description, value, onSave, readOnly }) => {
    const [draft, setDraft] = useState('');

    useEffect(() => {
      if (open) {
        setDraft(value == null ? '' : String(value));
      }
    }, [open, value]);

    const handleDiscard = () => {
      onClose();
    };

    const handleConfirm = () => {
      if (!readOnly) {
        onSave(draft);
      }
      onClose();
    };

    return (
      <Modal
        open={open}
        onClose={handleDiscard}
        width="lg"
        cornerExitButton={false}
        fixedBottomRow={!readOnly}
        bottomRowContent={
          !readOnly ? (
            <BottomPinnedRow data-testid="markdowneditormodal-footer">
              <StyledConfirmCancelRow
                onCancel={handleDiscard}
                onConfirm={handleConfirm}
              />
            </BottomPinnedRow>
          ) : undefined
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
    );
  },
);
