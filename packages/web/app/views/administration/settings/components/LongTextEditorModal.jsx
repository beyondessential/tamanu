import React from 'react';
import styled from 'styled-components';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-text';
import 'ace-builds/src-noconflict/theme-eclipse';
import 'ace-builds/src-noconflict/theme-dawn';

import { Modal } from '../../../../components/Modal';
import { Colors } from '../../../../constants';

const THEMES = {
  VIEW: 'dawn',
  EDIT: 'eclipse',
};

const StyledModal = styled(Modal)`
  .MuiPaper-root {
    height: 100%;
    display: flex;
    flex-direction: column;
    > :not(.MuiDialogTitle-root) {
      flex: 1;
      display: flex;
      flex-direction: column;
      > :not(.MuiDialogActions-root) {
        display: flex;
        flex-direction: column;
      }
    }
  }
`;

const Description = styled.div`
  font-size: 14px;
  margin-bottom: 12px;
  color: ${Colors.midText};
`;

const StyledEditor = styled(AceEditor)`
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  flex: 1;
`;

export const LongTextEditorModal = React.memo(
  ({ open, onClose, title, description, value, onChange, readOnly }) => (
    <StyledModal
      open={open}
      onClose={onClose}
      width="lg"
      title={title}
      data-testid="longtexteditormodal-modal"
    >
      {description && <Description data-testid="longtexteditormodal-desc">{description}</Description>}
      <StyledEditor
        mode="text"
        theme={readOnly ? THEMES.VIEW : THEMES.EDIT}
        value={value ?? ''}
        onChange={onChange}
        readOnly={readOnly}
        width="100%"
        height="100%"
        showPrintMargin={false}
        wrapEnabled
        tabSize={2}
        fontSize={14}
        highlightActiveLine={!readOnly}
        data-testid="longtexteditormodal-editor"
      />
    </StyledModal>
  ),
);
