import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-eclipse';
import 'ace-builds/src-noconflict/theme-dawn';

import { TAMANU_COLORS } from '../constants';

const THEMES = {
  VIEW: 'dawn',
  EDIT: 'eclipse',
};

const StyledJSONEditor = styled(AceEditor)`
  border: 1px solid ${(p) => (p.$hasError ? TAMANU_COLORS.alert : TAMANU_COLORS.outline)};
  border-radius: 4px;
  z-index: 0;
  .error-marker {
    position: absolute;
    background-color: ${TAMANU_COLORS.alert};
  }
`;

const generateAnnotationFromJSONError = (errorMessage, json) => {
  const rows = json.split('\n');
  let charCount = 0;
  let row = 0;
  let column;

  const positionString = errorMessage.match(/position (\d+)/)?.[1];
  const position = parseInt(positionString, 10);

  for (let i = 0; i < rows.length; i++) {
    charCount += rows[i].length + 1; // Add 1 for the newline character
    if (charCount > position) {
      row = i;
      column = position - (charCount - rows[i].length) + 1; // Add 1 to column count as 1 indexed
      break;
    }
  }
  return {
    type: 'error',
    row,
    column,
    text: errorMessage,
  };
};

export const JSONEditor = React.memo(
  ({ value, onChange, editMode, error, placeholder, fontSize, ...props }) => {
    const [errorAnnotation, setErrorAnnotation] = useState(null);
    const [marker, setMarker] = useState(null);

    useEffect(() => {
      if (!error) {
        setErrorAnnotation(null);
        setMarker([]);
      } else {
        const annotation = generateAnnotationFromJSONError(error.message, value);
        setErrorAnnotation(annotation);
        setMarker({
          startRow: annotation.row,
          startCol: annotation.column,
          endRow: annotation.row,
          endCol: annotation.column + 1, // endCol is exclusive so need to add 1 in order to highlight the final character
          className: 'error-marker',
          type: 'background',
        });
      }
    }, [error, value]);

    const onLoad = (editor) => {
      // Disable the "undo" command (Ctrl+Z)
      editor.commands.addCommand({
        name: 'undo',
        bindKey: { win: 'Ctrl-Z', mac: 'Command-Z' },
        exec: () => { }, // does nothing
      });
    };

    return (
      <StyledJSONEditor
        width="100%"
        height="100%"
        mode="json"
        showPrintMargin={false}
        placeholder={placeholder}
        fontSize={fontSize}
        theme={editMode ? THEMES.EDIT : THEMES.VIEW}
        onChange={onChange}
        value={value}
        highlightActiveLine={false}
        $hasError={!!errorAnnotation}
        readOnly={!editMode}
        annotations={errorAnnotation ? [errorAnnotation] : null}
        onLoad={onLoad}
        tabSize={2}
        markers={marker ? [marker] : null}
        wrapEnabled={!editMode}
        {...props}
        data-testid="styledjsoneditor-t3jl"
      />
    );
  },
);
