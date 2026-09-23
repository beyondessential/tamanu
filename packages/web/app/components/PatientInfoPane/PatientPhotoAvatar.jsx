import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Avatar from '@material-ui/core/Avatar';
import { CircularProgress, Menu, MenuItem } from '@material-ui/core';
import { Camera, Trash2, Upload } from 'lucide-react';
import { PHOTO_FILE_EXTENSIONS, PHOTO_MIME_TYPES } from '@tamanu/constants';
import { TranslatedText, useTranslation } from '@tamanu/ui-components';
import { PatientInitialsIcon } from '../PatientInitialsIcon';
import { PhotoCaptureModal } from '../PhotoCaptureModal';
import { useApi } from '../../api';
import {
  PATIENT_PROFILE_PICTURE_QUERY_KEY,
  usePatientProfilePictureQuery,
} from '../../api/queries';
import { useAuth } from '../../contexts/Auth';
import { notifyError } from '../../utils';
import { Colors } from '../../constants';

// Kept in step with what the server accepts, so the picker can't offer a file the upload will
// then refuse
const ACCEPTED_FILE_TYPES = [
  ...PHOTO_MIME_TYPES,
  ...PHOTO_FILE_EXTENSIONS.map(extension => `.${extension}`),
].join(',');

// A photo is stored as uploaded, so it's centre-cropped here to fit the avatar
const PhotoAvatar = styled(Avatar)`
  background: ${Colors.softOutline};
  width: 46px;
  height: 46px;

  .MuiAvatar-img {
    object-fit: cover;
    object-position: center;
  }
`;

const AvatarContainer = styled.div`
  position: relative;
  // sits above the header's navigation overlay so the photo controls are reachable
  z-index: 1;
  pointer-events: auto;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
`;

const ChangePhotoButton = styled.button`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(50, 102, 153, 0.55);
  color: ${Colors.white};
  cursor: pointer;
  opacity: 0;
  transition: opacity 100ms ease;

  ${AvatarContainer}:hover &,
  &:focus-visible,
  &[aria-expanded='true'] {
    opacity: 1;
  }

  &:disabled {
    cursor: default;
  }
`;

const UploadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
`;

const MenuItemLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
`;

const RemoveMenuItem = styled(MenuItem)`
  color: ${Colors.alert};
`;

const HiddenFileInput = styled.input`
  display: none;
`;

export const PatientPhotoAvatar = ({ patient }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { ability } = useAuth();
  const { getTranslation } = useTranslation();
  const fileInputRef = useRef(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [isCaptureOpen, setCaptureOpen] = useState(false);

  const { data: photo } = usePatientProfilePictureQuery(patient.id);
  const canChangePhoto = ability?.can('write', 'Patient');

  const closeMenu = () => setMenuAnchor(null);
  const openMenu = event => setMenuAnchor(event.currentTarget);

  const refreshPhoto = () =>
    queryClient.invalidateQueries([PATIENT_PROFILE_PICTURE_QUERY_KEY, patient.id]);

  const { mutate: savePhoto, isLoading: isSaving } = useMutation(
    file =>
      api.postWithFileUpload(`patient/${patient.id}/profilePicture`, file, { type: file.type }),
    {
      onSuccess: refreshPhoto,
      onError: error =>
        notifyError(
          getTranslation('patient.photo.error.uploadFailed', 'Photo could not be saved. :message', {
            replacements: { message: error.message },
          }),
        ),
    },
  );

  const { mutate: removePhoto, isLoading: isRemoving } = useMutation(
    () => api.delete(`patient/${patient.id}/profilePicture`),
    {
      onSuccess: refreshPhoto,
      onError: error =>
        notifyError(
          getTranslation(
            'patient.photo.error.removeFailed',
            'Photo could not be removed. :message',
            { replacements: { message: error.message } },
          ),
        ),
    },
  );

  const isBusy = isSaving || isRemoving;

  const handleFileSelected = event => {
    const file = event.target.files?.[0];
    // reset so picking the same file again still fires a change
    event.target.value = '';
    if (file) savePhoto(file);
  };

  const handleUploadClick = () => {
    closeMenu();
    fileInputRef.current?.click();
  };

  const handleCaptureClick = () => {
    closeMenu();
    setCaptureOpen(true);
  };

  const handleRemoveClick = () => {
    closeMenu();
    removePhoto();
  };

  return (
    <AvatarContainer data-testid="patient-photo-avatar">
      {photo?.data ? (
        <PhotoAvatar
          src={`data:${photo.mimeType};base64,${photo.data}`}
          alt=""
          data-testid="patientphotoavatar"
        />
      ) : (
        <PatientInitialsIcon patient={patient} />
      )}
      {canChangePhoto && !isBusy && (
        <ChangePhotoButton
          type="button"
          onClick={openMenu}
          aria-haspopup="menu"
          aria-expanded={Boolean(menuAnchor)}
          aria-label={getTranslation('patient.photo.action.change', 'Change photo')}
          data-testid="change-photo-button"
        >
          <Camera size={18} />
        </ChangePhotoButton>
      )}
      {isBusy && (
        <UploadingOverlay data-testid="photo-saving-overlay">
          <CircularProgress size={20} />
        </UploadingOverlay>
      )}
      <HiddenFileInput
        type="file"
        ref={fileInputRef}
        accept={ACCEPTED_FILE_TYPES}
        onChange={handleFileSelected}
        data-testid="photo-file-input"
      />
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleUploadClick} data-testid="upload-photo-item">
          <MenuItemLabel>
            <Upload size={15} />
            <TranslatedText stringId="patient.photo.action.upload" fallback="Upload photo" />
          </MenuItemLabel>
        </MenuItem>
        <MenuItem onClick={handleCaptureClick} data-testid="take-photo-item">
          <MenuItemLabel>
            <Camera size={15} />
            <TranslatedText stringId="patient.photo.action.take" fallback="Take photo" />
          </MenuItemLabel>
        </MenuItem>
        {photo?.data && (
          <RemoveMenuItem onClick={handleRemoveClick} data-testid="remove-photo-item">
            <MenuItemLabel>
              <Trash2 size={15} />
              <TranslatedText stringId="patient.photo.action.remove" fallback="Remove photo" />
            </MenuItemLabel>
          </RemoveMenuItem>
        )}
      </Menu>
      <PhotoCaptureModal
        open={isCaptureOpen}
        onClose={() => setCaptureOpen(false)}
        onCapture={savePhoto}
      />
    </AvatarContainer>
  );
};
