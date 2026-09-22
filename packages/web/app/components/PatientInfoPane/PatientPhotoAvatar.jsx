import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { CircularProgress, Menu, MenuItem } from '@material-ui/core';
import { Camera, Trash2, Upload } from 'lucide-react';
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

// Photos are captured and uploaded as JPEG, matching the survey and document photo fields
const ACCEPTED_FILE_TYPES = 'image/jpeg,.jpg,.jpeg';

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
  const [isSaving, setSaving] = useState(false);

  const { data: photo } = usePatientProfilePictureQuery(patient.id);
  const canChangePhoto = ability?.can('write', 'Patient');

  const refreshPhoto = () =>
    queryClient.invalidateQueries([PATIENT_PROFILE_PICTURE_QUERY_KEY, patient.id]);

  const closeMenu = () => setMenuAnchor(null);

  // The avatar sits inside a button that navigates to the patient, so every interaction here
  // has to be kept from reaching it
  const openMenu = event => {
    event.preventDefault();
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const savePhoto = useCallback(
    async file => {
      setSaving(true);
      try {
        await api.postWithFileUpload(`patient/${patient.id}/profilePicture`, file, {
          type: file.type,
        });
        await refreshPhoto();
      } catch (error) {
        notifyError(
          getTranslation('patient.photo.error.uploadFailed', 'Photo could not be saved. :message', {
            replacements: { message: error.message },
          }),
        );
      } finally {
        setSaving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api, patient.id, getTranslation],
  );

  const handleFileSelected = event => {
    const file = event.target.files?.[0];
    // reset so picking the same file again still fires a change
    event.target.value = '';
    if (file) savePhoto(file);
  };

  const handleUploadClick = event => {
    event.stopPropagation();
    closeMenu();
    fileInputRef.current?.click();
  };

  const handleCaptureClick = event => {
    event.stopPropagation();
    closeMenu();
    setCaptureOpen(true);
  };

  const handleRemoveClick = async event => {
    event.stopPropagation();
    closeMenu();
    setSaving(true);
    try {
      await api.delete(`patient/${patient.id}/profilePicture`);
      await refreshPhoto();
    } catch (error) {
      notifyError(
        getTranslation('patient.photo.error.removeFailed', 'Photo could not be removed. :message', {
          replacements: { message: error.message },
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AvatarContainer onClick={event => event.stopPropagation()} data-testid="patient-photo-avatar">
      <PatientInitialsIcon patient={patient} photo={photo} />
      {canChangePhoto && !isSaving && (
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
      {isSaving && (
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
