import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-eclipse';
import 'ace-builds/src-noconflict/theme-dawn';

import { Colors } from '../../../constants';

const THEMES = {
  VIEW: 'dawn',
  EDIT: 'eclipse',
};

const StyledJSONEditor = styled(AceEditor)`
  border: 1px solid ${p => (p.$isJsonValid ? Colors.outline : Colors.alert)};
  border-radius: 4px;
  .error-marker {
    position: absolute;
    background-color: ${Colors.alert};
  }
`;

const generateAnnotationFromJSONError = (errorMessage, json) => {
  const rows = json.split('\n');
  let charCount = 0;
  let row;
  let column;

  const position = errorMessage.match(/position (\d+)/)?.[1];

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
  ({ value, onChange, editMode, error, placeholderText, fontSize }) => {
    const [errorAnnotation, setErrorAnnotation] = useState(null);
    const [marker, setMarker] = useState(null);

    const isValidJSON = !error?.message;

    useEffect(() => {
      if (isValidJSON) {
        setErrorAnnotation(null);
        setMarker([]);
      } else {
        const annotation = generateAnnotationFromJSONError(error.message, value);
        setErrorAnnotation(annotation);
        setMarker([
          {
            startRow: annotation.row,
            startCol: annotation.column,
            endRow: annotation.row,
            endCol: annotation.column + 1, // endCol is exclusive so need to add 1 in order to highlight the character
            className: 'error-marker',
            type: 'background',
          },
        ]);
      }
    }, [error, value, isValidJSON]);

    const onLoad = editor => {
      // Disable the "undo" command (Ctrl+Z)
      editor.commands.addCommand({
        name: 'undo',
        bindKey: { win: 'Ctrl-Z', mac: 'Command-Z' },
        exec: () => {}, // does nothing
      });
    };

    return (
      <StyledJSONEditor
        height="600px"
        width="100%"
        mode="json"
        showPrintMargin={false}
        placeholder={placeholderText}
        fontSize={fontSize}
        theme={editMode ? THEMES.EDIT : THEMES.VIEW}
        onChange={onChange}
        value={value}
        highlightActiveLine={false}
        $isJsonValid={isValidJSON}
        readOnly={!editMode}
        annotations={errorAnnotation ? [errorAnnotation] : null}
        onLoad={onLoad}
        tabSize={2}
        markers={marker}
      />
    );
  },
);
