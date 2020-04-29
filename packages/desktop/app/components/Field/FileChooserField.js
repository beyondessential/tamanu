import React, { useCallback } from 'react';
import styled from 'styled-components';
import { Button } from '../Button';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import MuiTextField from '@material-ui/core/TextField';

// this import means that file chooser can't be previewed in storybook
import { remote } from 'electron';

const FieldButtonRow = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: auto min-content;
  grid-gap: 0.5rem;
`;

export const FILTER_EXCEL = { name: 'Microsoft Excel files (.xlsx)', extensions: ['xlsx'] };

export const FileChooserInput = ({ value = '', label, name, filters, onChange, ...props }) => {
  const browseForFile = useCallback(async () => {
    // showOpenDialog returns an array, but we only want one, so just take the first element
    // (if support for multiple files is needed in future it should be in a separate component)
    const [result] = await remote.dialog.showOpenDialog(null, {
      filters
    });
    if (!result) return;
    onChange({ target: { name, value: result } });
  });

  return (
    <OuterLabelFieldWrapper label={label} {...props}>
      <FieldButtonRow>
        <MuiTextField readOnly variant="outlined" value={value} />
        <Button onClick={browseForFile} variant="contained">Browse</Button>
      </FieldButtonRow>
    </OuterLabelFieldWrapper>
  );
};

export const FileChooserField = ({ field, ...props }) => (
  <FileChooserInput name={field.name} value={field.value || ''} onChange={field.onChange} {...props} />
);
