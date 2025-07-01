import React, { useRef } from 'react';
import styled from 'styled-components';
import { Box, IconButton } from '@material-ui/core';
import { Colors } from '../../constants';
import { Button } from '../Button';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { TranslatedText } from '../Translation/TranslatedText';
import { ClearIcon } from '../Icons/ClearIcon';
import { ConditionalTooltip } from '../Tooltip';

const StyledIconButton = styled(IconButton)`
  margin-left: 5px;
  padding: 5px;
`;

const StyledClearIcon = styled(ClearIcon)`
  cursor: pointer;
  color: ${Colors.darkText};
`;

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

// Smaller string with ellipsis in the middle to show file extension
const getSmallFileName = (value, maxLength) => {
  const middlePoint = Math.floor(maxLength / 2);
  const ellipsisOffset = 3;
  const lastHalfIndex = value.length - middlePoint + ellipsisOffset;
  return value.slice(0, middlePoint) + '...' + value.slice(lastHalfIndex, value.length);
};

const ValueSection = ({ value, useSmallDisplay, showFileDialog, onClear }) => {
  if (useSmallDisplay) {
    const maxLength = 50;
    const needEllipsis = value.name.length > maxLength;
    const smallName = needEllipsis ? getSmallFileName(value.name, maxLength) : value.name;
    return (
      <Box display="flex">
        <ConditionalTooltip
          visible={needEllipsis}
          title={value.name}
          data-testid="themedtooltip-h7lo"
        >
          {smallName}
        </ConditionalTooltip>
        <StyledIconButton
          onClick={onClear}
          data-testid="removeselectionbutton-yt3j"
        >
          <StyledClearIcon />
        </StyledIconButton>
      </Box>
    );
  }

  return (
    <>
      {value.name}
      <ChangeSelectionButton
        onClick={showFileDialog}
        data-testid="changeselectionbutton-fvw1"
      >
        <TranslatedText
          stringId="chooseFile.button.changeSelection.label"
          fallback="Change selection"
          data-testid="translatedtext-qw1d"
        />
      </ChangeSelectionButton>
    </>
  );
};

export const FILTER_EXCEL = { name: 'Microsoft Excel files (.xlsx)', extensions: ['xlsx'] };
export const FILTER_IMAGES = { name: 'Images (.png, .svg)', extensions: ['png', 'svg'] };
export const FILTER_PHOTOS = { name: 'Photos (.jpg, .jpeg)', extensions: ['jpg', 'jpeg'] };

export const FileChooserInput = ({
  value = '',
  label,
  name,
  filters,
  onChange,
  useSmallDisplay = false,
  ...props
}) => {
  // Convert the given filters into string format for the accept attribute of file input
  const acceptString = filters.map((filter) => `.${filter.extensions.join(', .')}`).join(', ');

  const inputRef = useRef(null);

  const showFileDialog = () => {
    inputRef.current.click();
  };

  const selectFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    onChange({ target: { name, value: file } });
  };

  const onClear = () => {
    onChange({ target: { name, value: '' } });
  };

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        onChange={selectFile}
        accept={acceptString}
        style={{ display: 'none' }}
        data-testid="input-q5no"
      />
      <OuterLabelFieldWrapper label={label} {...props} data-testid="outerlabelfieldwrapper-uc1o">
        <FieldButtonRow className={value ? 'has-value' : ''} data-testid="fieldbuttonrow-snj9">
          {value ? (
            <ValueSection
              value={value}
              useSmallDisplay={useSmallDisplay}
              showFileDialog={showFileDialog}
              onClear={onClear}
            />
          ) : (
            <>
              <Button
                onClick={showFileDialog}
                variant="outlined"
                color="primary"
                data-testid="button-1mo9"
              >
                <TranslatedText
                  stringId="chooseFile.button.label"
                  fallback="Choose file"
                  data-testid="translatedtext-9peo"
                />
              </Button>
              <HintText data-testid="hinttext-oxv8">
                <TranslatedText
                  stringId="chooseFile.hint.max10Mb.label"
                  fallback="Max 10 MB"
                  data-testid="translatedtext-u0s3"
                />
                <br />
                <TranslatedText
                  stringId="chooseFile.hint.supportedFileTypes.label"
                  fallback="Supported file types"
                  data-testid="translatedtext-k2w3"
                />
                : {filters.map((filter) => filter.name).join(', ')}
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
    data-testid="filechooserinput-0fxi"
  />
);
