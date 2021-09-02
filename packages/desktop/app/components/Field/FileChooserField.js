import React, { useCallback } from 'react';
import styled from 'styled-components';
import MuiTextField from '@material-ui/core/TextField';
import { Button } from '../Button';
import { useElectron } from '../../contexts/Electron';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';

// this import means that file chooser can't be previewed in storybook

const FieldButtonRow = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: auto min-content;
  grid-gap: 0.5rem;
`;

export const FILTER_EXCEL = { name: 'Microsoft Excel files (.xlsx)', extensions: ['xlsx'] };

export const FileChooserInput = ({ value = '', label, name, filters, onChange, ...props }) => {
  const { showOpenDialog } = useElectron();
  const browseForFile = useCallback(async () => {
    const { filePaths, canceled } = await showOpenDialog(null, {
      filters,
    });
    if (canceled) return;

    // showOpenDialog gives an array of files, but for this component we only want one, 
    // so just take the first element.
    // (if support for multiple files is needed in future it should be in a separate component)
    const [result] = filePaths;
    if (!result) return;

    onChange({ target: { name, value: result } });
  });

  return (
    <OuterLabelFieldWrapper label={label} {...props}>
      <FieldButtonRow>
        <MuiTextField readOnly variant="outlined" value={value} />
        <Button onClick={browseForFile} variant="contained">
          Browse
        </Button>
      </FieldButtonRow>
    </OuterLabelFieldWrapper>
  );
};

export const FileChooserField = ({ field, ...props }) => (
  <FileChooserInput
    name={field.name}
    value={field.value || ''}
    onChange={field.onChange}
    {...props}
  />
);
