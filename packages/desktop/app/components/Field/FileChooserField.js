import React, { useCallback } from 'react';
import styled from 'styled-components';
import MuiTextField from '@material-ui/core/TextField';
import PublishIcon from '@material-ui/icons/Publish';
import { Button } from '../Button';
import { useElectron } from '../../contexts/Electron';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';

// this import means that file chooser can't be previewed in storybook

const FieldButtonRow = styled.div`
  width: 100%;
  display: grid;
  margin-top: 0.5rem;
  grid-template-columns: max-content auto;
  grid-gap: 1rem;
  &.has-value {
    grid-template-columns: auto max-content;
  }
`;

const HintText = styled.div`
  font-size: 0.9em;
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
  }, [showOpenDialog, filters, name, onChange]);

  return (
    <OuterLabelFieldWrapper label={label} {...props}>
      <FieldButtonRow className={value ? 'has-value' : ''}>
        {value ? (
          <>
            <MuiTextField readOnly value={value} variant="outlined" />
            <Button onClick={browseForFile} variant="outlined">
              <PublishIcon />
              <span style={{ marginLeft: '0.5rem' }}>Change selection</span>
            </Button>
          </>
        ) : (
          <>
            <Button onClick={browseForFile} variant="outlined" color="primary">
              Choose file
            </Button>
            <HintText>
              Max 10 MB
              <br />
              Supported file types: {filters.map(filter => filter.name).join(', ')}
            </HintText>
          </>
        )}
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
