import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { notifyError } from '../../../utils';
import { route } from '@tamanu/api-client';

export const DeletePhotoLinkModal = ({ open, onClose, answerId }) => {
  const api = useApi();
  const queryClient = useQueryClient();

  const onSubmit = async () => {
    try {
      await api.put(route('surveyResponseAnswer/photo/:answerId', { answerId }));
      // Shown from both the encounter and the program registry chart tables
      queryClient.invalidateQueries(['encounterCharts']);
      queryClient.invalidateQueries(['programRegistryPatientCharts']);
    } catch (error) {
      notifyError(error);
    }
    onClose();
  };

  return (
    <ConfirmModal
      title={
        <TranslatedText
          stringId="photo.modal.delete.title"
          fallback="Delete image"
          data-testid="translatedtext-sbz5"
        />
      }
      subText={
        <TranslatedText
          stringId="photo.modal.delete.confirmation"
          fallback="Are you sure you would like to delete this image from the chart record?"
          data-testid="translatedtext-kd99"
        />
      }
      confirmButtonText={
        <TranslatedText
          stringId="photo.modal.delete.confirmText"
          fallback="Delete image"
          data-testid="translatedtext-1000"
        />
      }
      open={open}
      onCancel={onClose}
      onConfirm={onSubmit}
      data-testid="confirmmodal-1gbx"
    />
  );
};
