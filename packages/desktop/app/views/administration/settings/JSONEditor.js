import React, { useState } from 'react';
import styled from 'styled-components';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-eclipse';
import 'ace-builds/src-noconflict/theme-dawn';

import { Colors } from '../../../constants';

const StyledAceEditor = styled(AceEditor)`
  border: 1px solid ${p => (p.$isJsonValid ? Colors.outline : Colors.alert)};
  border-radius: 4px;
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

export const JSONEditor = React.memo(({ value, onChange, editMode }) => {
  const [errorAnnotation, setErrorAnnotation] = useState(null);

  const isValidJSON = !errorAnnotation;

  const checkValidJson = json => {
    try {
      JSON.parse(json);
      setErrorAnnotation(null);
    } catch (error) {
      const annotation = generateAnnotationFromJSONError(error.message, json);
      setErrorAnnotation([annotation]);
      return false;
    }
    return true;
  };

  const onLoad = editor => {
    // Disable the "undo" command (Ctrl+Z)
    editor.commands.addCommand({
      name: 'undo',
      bindKey: { win: 'Ctrl-Z', mac: 'Command-Z' },
      exec: () => {},
    });
  };

  const onChangeJSONString = newValue => {
    checkValidJson(newValue);
    onChange(newValue);
  };

  return (
    <StyledAceEditor
      width="100%"
      height="600px"
      mode="json"
      showPrintMargin={false}
      placeholder="No settings found for this facility/server"
      fontSize={14}
      theme={editMode ? 'eclipse' : 'dawn'}
      onChange={onChangeJSONString}
      value={value}
      highlightActiveLine={editMode}
      $isJsonValid={isValidJSON}
      readOnly={!editMode}
      annotations={errorAnnotation}
      onLoad={onLoad}
    />
  );
});
