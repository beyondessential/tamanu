import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { Box, IconButton } from '@material-ui/core';
import { CameraAlt } from '@material-ui/icons';
import { toast } from 'react-toastify';
import { SETTING_KEYS } from '@tamanu/constants';
import { TAMANU_COLORS } from '../../constants';
import { Button } from '../Button';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { TranslatedText } from '../Translation/TranslatedText';
import { ClearIcon } from '../Icons/ClearIcon';
import { ConditionalTooltip } from '../Tooltip';
import { useSettings } from '../../contexts';
import { FileUploadIcon as FileUpload } from '../Icons/FileUploadIcon';

const StyledIconButton = styled(IconButton)`
  margin-left: 5px;
  padding: 5px;
`;

const StyledClearIcon = styled(ClearIcon)`
  cursor: pointer;
  color: ${TAMANU_COLORS.darkText};
`;

const FieldButtonRow = styled.div`
  width: 100%;
  display: grid;
  margin-top: 0.5rem;
  grid-template-columns: max-content auto;
  grid-gap: 1rem;

  &.has-camera {
    grid-template-columns: max-content max-content auto;
  }
`;

const HintText = styled.div`
  font-size: 11px;
  color: ${TAMANU_COLORS.darkText};
`;

const ChangeSelectionButton = styled.a`
  color: ${TAMANU_COLORS.primary};
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

const ValueSection = ({ value, smallDisplay, showFileDialog, onClear }) => {
  if (smallDisplay) {
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
        <StyledIconButton onClick={onClear} data-testid="removeselectionbutton-yt3j">
          <StyledClearIcon />
        </StyledIconButton>
      </Box>
    );
  }

  return (
    <>
      {value.name}
      <ChangeSelectionButton onClick={showFileDialog} data-testid="changeselectionbutton-fvw1">
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

const getFilterNames = filters => {
  if (filters.length === 1 && filters[0].name === FILTER_PHOTOS.name) {
    return filters[0].extensions.join(' or ');
  }
  return filters.map(filter => filter.name).join(', ');
};

export const FileChooserInput = ({
  value = '',
  label,
  name,
  filters,
  onChange,
  smallDisplay = false,
  WebcamCaptureModalComponent,
  buttonText = (
    <TranslatedText
      stringId="chooseFile.button.label"
      fallback="Choose file"
      data-testid="translatedtext-9peo"
    />
  ),
  ...props
}) => {
  const { getSetting } = useSettings();
  const maxFileSizeInMB = getSetting(SETTING_KEYS.FILE_CHOOSER_MB_SIZE_LIMIT) || 10;
  const maxFileSizeInBytes = maxFileSizeInMB * 1000 * 1000;
  const [isWebcamModalOpen, setIsWebcamModalOpen] = useState(false);

  // Convert the given filters into string format for the accept attribute of file input
  const acceptString = filters.map(filter => `.${filter.extensions.join(', .')}`).join(', ');

  const inputRef = useRef(null);

  const showFileDialog = () => {
    if (!inputRef.current) return;
    inputRef.current.click();
  };

  const validateFileSize = file => {
    const fileSize = file.size;
    if (fileSize > maxFileSizeInBytes) {
      toast.error(
        <TranslatedText
          stringId="chooseFile.alert.exceedsMaxSize"
          fallback="Selected file size exceeds the maximum allowed size of :maxFileSizeInMB MB"
          replacements={{ maxFileSizeInMB }}
          data-testid="translatedtext-b4t3"
        />,
      );
      return false;
    }
    return true;
  };

  const selectFile = event => {
    const file = event.target.files[0];
    if (!file) return;

    if (!validateFileSize(file)) {
      return;
    }

    onChange({ target: { name, value: file } });
  };

  const onClear = () => {
    onChange({ target: { name, value: '' } });

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const openWebcamModal = () => {
    setIsWebcamModalOpen(true);
  };

  const closeWebcamModal = () => {
    setIsWebcamModalOpen(false);
  };

  const handleWebcamCapture = file => {
    if (!validateFileSize(file)) {
      return;
    }

    onChange({ target: { name, value: file } });
    closeWebcamModal();
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
        <FieldButtonRow
          className={`${value ? 'has-value' : ''} ${WebcamCaptureModalComponent ? 'has-camera' : ''}`}
          data-testid="fieldbuttonrow-snj9"
        >
          {value ? (
            <ValueSection
              value={value}
              smallDisplay={smallDisplay}
              showFileDialog={showFileDialog}
              onClear={onClear}
            />
          ) : (
            <>
              {WebcamCaptureModalComponent && (
                <Button
                  onClick={openWebcamModal}
                  variant="outlined"
                  color="primary"
                  data-testid="button-webcam"
                >
                  <CameraAlt />
                  <TranslatedText
                    stringId="general.questionComponent.photoField.takePhotoButtonText"
                    fallback="Take photo with camera"
                    data-testid="translatedtext-webcam"
                  />
                </Button>
              )}
              <Button
                onClick={showFileDialog}
                variant="outlined"
                color="primary"
                data-testid="button-1mo9"
              >
                <FileUpload />
                <Box width="10px" />
                {buttonText}
              </Button>

              <HintText data-testid="hinttext-oxv8">
                <Box component="span" fontWeight="500">
                  <TranslatedText
                    stringId="chooseFile.hint.maxSize.label"
                    fallback="Max :maxFileSizeInMB MB"
                    replacements={{ maxFileSizeInMB }}
                    data-testid="translatedtext-u0s3"
                  />
                </Box>
                <br />
                <TranslatedText
                  stringId="chooseFile.hint.supportedFileTypes.label"
                  fallback="Supported file types"
                  data-testid="translatedtext-k2w3"
                />
                : {getFilterNames(filters)}
              </HintText>
            </>
          )}
        </FieldButtonRow>
      </OuterLabelFieldWrapper>
      {WebcamCaptureModalComponent && (
        <WebcamCaptureModalComponent
          open={isWebcamModalOpen}
          onClose={closeWebcamModal}
          onCapture={handleWebcamCapture}
        />
      )}
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
