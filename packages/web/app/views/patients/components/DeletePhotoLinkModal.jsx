import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

export const DeletePhotoLinkModal = ({ open, onClose, answerId }) => {
  const api = useApi();
  const queryClient = useQueryClient();

  const onSubmit = async () => {
    await api.put(`surveyResponseAnswer/photo/${answerId}`);
    queryClient.invalidateQueries({ queryKey: ['encounterCharts'] });
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
      open={open}
      onCancel={onClose}
      onConfirm={onSubmit}
      data-testid="confirmmodal-1gbx"
    />
  );
};
