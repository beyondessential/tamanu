import React, { useRef } from 'react';
import styled from 'styled-components';
import { Colors } from '../../constants';
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
`;

const HintText = styled.div`
  font-size: 0.9em;
`;

const ChangeSelectionButton = styled.a`
  color: ${Colors.primary};
  font-weight: 500;
  cursor: pointer;
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
        data-test-id='input-7sx5' />
      <OuterLabelFieldWrapper label={label} {...props}>
        <FieldButtonRow className={value ? 'has-value' : ''}>
          {value ? (
            <>
              {value.name}
              <ChangeSelectionButton onClick={showFileDialog}>
                <TranslatedText
                  stringId="chooseFile.button.changeSelection.label"
                  fallback="Change selection"
                  data-test-id='translatedtext-oiyi' />
              </ChangeSelectionButton>
            </>
          ) : (
            <>
              <Button
                onClick={showFileDialog}
                variant="outlined"
                color="primary"
                data-test-id='button-p25q'>
                <TranslatedText
                  stringId="chooseFile.button.label"
                  fallback="Choose file"
                  data-test-id='translatedtext-6nfa' />
              </Button>
              <HintText>
                <TranslatedText
                  stringId="chooseFile.hint.max10Mb.label"
                  fallback="Max 10 MB"
                  data-test-id='translatedtext-h8s9' />
                <br />
                <TranslatedText
                  stringId="chooseFile.hint.supportedFileTypes.label"
                  fallback="Supported file types"
                  data-test-id='translatedtext-bqsm' />
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
