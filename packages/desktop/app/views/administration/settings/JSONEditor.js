import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-eclipse';
import 'ace-builds/src-noconflict/theme-dawn';

import { Colors } from '../../../constants';

const StyledJSONEditor = styled(AceEditor)`
  border: 1px solid ${p => (p.$isJsonValid ? Colors.outline : Colors.alert)};
  border-radius: 4px;
  .error-marker {
    position: absolute;
    background-color: ${Colors.alert} !important;
  }
`;

const generateAnnotationFromJSONError = (errorMessage, json) => {
  const rows = json.split('\n');
  let charCount = 0;
  let row;
  let column;

  const match = errorMessage.match(/position (\d+)/);
  const position = parseInt(match && match[1], 10);

  for (let i = 0; i < rows.length; i++) {
    charCount += rows[i].length + 1; // Add 1 for the newline character
    if (charCount > position) {
      row = i;
      column = position - (charCount - rows[i].length);
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

export const JSONEditor = React.memo(({ value, onChange, editMode, error }) => {
  const [errorAnnotation, setErrorAnnotation] = useState(null);
  const [marker, setMarker] = useState(null);

  const isValidJSON = !error?.message;

  useEffect(() => {
    if (isValidJSON) {
      setErrorAnnotation(null);
      setMarker([]);
    } else {
      const annotation = generateAnnotationFromJSONError(error.message, value);
      setErrorAnnotation([annotation]);
      setMarker([
        {
          startRow: annotation.row,
          startCol: annotation.column + 1,
          endRow: annotation.row,
          endCol: annotation.column + 2,
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
      exec: () => {},
    });
  };

  // const onChangeJSONString = newValue => {
  //   // checkValidJson(newValue);
  //   onChange(newValue);
  // };

  return (
    <StyledJSONEditor
      width="100%"
      height="600px"
      mode="json"
      showPrintMargin={false}
      placeholder="No settings found for this facility/server"
      fontSize={14}
      theme={editMode ? 'eclipse' : 'dawn'}
      onChange={onChange}
      value={value}
      highlightActiveLine={false}
      $isJsonValid={isValidJSON}
      readOnly={!editMode}
      annotations={errorAnnotation}
      onLoad={onLoad}
      tabSize={2}
      markers={marker}
    />
  );
});
