import React, { useRef } from 'react';
import styled from 'styled-components';
import MuiTextField from '@material-ui/core/TextField';
import PublishIcon from '@material-ui/icons/Publish';
import { Button } from '../Button';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { TranslatedText } from '../Translation/TranslatedText';

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
export const FILTER_IMAGES = { name: 'Images (.png, .svg)', extensions: ['png', 'svg'] };

export const FileChooserInput = ({ value = '', label, name, filters, onChange, ...props }) => {
  // Convert the given filters into string format for the accept attribute of file input
  const acceptString = filters.map(filter => `.${filter.extensions.join(', .')}`).join(', ');

  const inputRef = useRef(null);

  const showFileDialog = () => {
    inputRef.current.click();
  };

  const selectFile = event => {
    const file = event.target.files[0];
    if (!file) return;

    onChange({ target: { name, value: file } });
  };

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        onChange={selectFile}
        accept={acceptString}
        style={{ display: 'none' }}
      />
      <OuterLabelFieldWrapper label={label} {...props}>
        <FieldButtonRow className={value ? 'has-value' : ''}>
          {value ? (
            <>
              <MuiTextField readOnly value={value.name} variant="outlined" />
              <Button onClick={showFileDialog} variant="outlined">
                <PublishIcon />
                <span style={{ marginLeft: '0.5rem' }}>Change selection</span>
              </Button>
            </>
          ) : (
            <>
              <Button onClick={showFileDialog} variant="outlined" color="primary">
                <TranslatedText stringId="chooseFile.button.label" fallback="Choose file" />
              </Button>
              <HintText>
                <TranslatedText stringId="chooseFile.hint.max10Mb.label" fallback="Max 10 MB" />
                <br />
                <TranslatedText
                  stringId="chooseFile.hint.supportedFileTypes.label"
                  fallback="Supported file types"
                />
                : {filters.map(filter => filter.name).join(', ')}
              </HintText>
            </>
          )}
        </FieldButtonRow>
      </OuterLabelFieldWrapper>
    </>
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
