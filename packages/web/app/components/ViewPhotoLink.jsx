import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { subject } from '@casl/ability';
import { useApi } from '../api';
import { getImageSourceFromData } from '../utils';
import { Button, OutlinedButton, TextButton, ButtonRow, Modal, TranslatedText } from '@tamanu/ui-components';
import { Divider } from '@material-ui/core';
import { LoadingIndicator } from './LoadingIndicator';
import { useTranslation } from '../contexts/Translation';
import { DeletePhotoLinkModal } from '../views/patients/components/DeletePhotoLinkModal';
import { useAuth } from '../contexts/Auth';
import { useExport } from '../contexts/ExportContext';

const Image = styled.img`
  display: block;
  margin: 0 auto;
  width: 400px;
`;

const ChartViewText = styled.span`
  text-decoration: underline;
  font-size: 14px;
`;

const SpaceBetweenButtonRow = styled(ButtonRow)`
  justify-content: space-between;
`;

const TextDisplay = ({ isChartView }) => {
  if (isChartView) {
    return (
      <ChartViewText>
        <TranslatedText
          stringId="program.modal.view.action.viewImage.label.short"
          fallback="View"
          data-testid="translatedtext-ta3g"
        />
      </ChartViewText>
    );
  }

  return (
    <TranslatedText
      stringId="program.modal.view.action.viewImage"
      fallback="View Image"
      data-testid="translatedtext-wagq"
    />
  );
};

const Footer = ({ hasError, onDelete, onClose }) => {
  const showDeleteButton = onDelete && !hasError;
  const RowComponent = showDeleteButton ? SpaceBetweenButtonRow : ButtonRow;
  return (
    <>
      <Divider style={{ margin: '32px -32px 30px -32px' }} data-testid="divider-ib6q" />
      <RowComponent>
        {showDeleteButton && (
          <OutlinedButton onClick={onDelete} data-testid="outlinedbutton-y5xo">
            <TranslatedText
              stringId="photo.action.deleteImage"
              fallback="Delete image"
              data-testid="translatedtext-ka8c"
            />
          </OutlinedButton>
        )}
        <Button onClick={onClose} data-testid="button-lsea">
          <TranslatedText
            stringId="general.action.close"
            fallback="Close"
            data-testid="translatedtext-9fgw"
          />
        </Button>
      </RowComponent>
    </>
  );
};

const ImageModalContent = ({ imageData, errorMessage }) => {
  const isLoading = !imageData && !errorMessage;
  if (isLoading) {
    return <LoadingIndicator height="400px" data-testid="loadingindicator-5htv" />;
  }
  if (errorMessage) {
    return <p>{errorMessage}</p>;
  }
  return <Image src={getImageSourceFromData(imageData)} data-testid="image-7oxc" />;
};

export const ViewPhotoLink = ({ answerId, surveyId, imageId, chartTitle = null }) => {
  const { isExporting } = useExport();
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const api = useApi();
  const { getTranslation } = useTranslation();
  const { ability } = useAuth();



  const openModalCallback = useCallback(async () => {
    setIsPhotoModalOpen(true);
    if (!navigator.onLine) {
      setImageData(null);
      const noInternetMessage = getTranslation(
        'program.modal.view.action.viewImage.noInternet',
        'You do not currently have an internet connection. Images require live internet for viewing.',
      );
      setErrorMessage(noInternetMessage);
      return;
    }

    try {
      const { data } = await api.get(`attachment/${imageId}`, { base64: true });
      setImageData(data);
      setErrorMessage(null);
    } catch (error) {
      setImageData(null);
      const genericErrorMessage = getTranslation(
        'program.modal.view.action.viewImage.error',
        'Image cannot be viewed at this time. Please try again in a few minutes or contact your system administrator.',
      );
      setErrorMessage(genericErrorMessage);
    }
  }, [api, imageId, getTranslation]);

  // Return nothing when exporting
  if (isExporting) {
    return null;
  }
  const isChartView = !!chartTitle;
  const viewImageText = getTranslation('program.modal.view.title.viewImage', 'View image');
  const imageText = getTranslation('program.modal.view.title.image', 'Image');
  const title = isChartView ? `${chartTitle} | ${viewImageText}` : imageText;
  const canDelete = ability.can('delete', subject('Charting', { id: surveyId }));

  return (
    <>
      <TextButton color="blue" onClick={openModalCallback} data-testid="textbutton-p17p">
        <TextDisplay isChartView={isChartView} />
      </TextButton>
      <Modal
        title={title}
        open={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        data-testid="modal-zpy7"
      >
        <ImageModalContent imageData={imageData} errorMessage={errorMessage} />
        {isChartView && (
          <Footer
            hasError={!!errorMessage}
            onDelete={canDelete ? () => setIsDeleteModalOpen(true) : null}
            onClose={() => setIsPhotoModalOpen(false)}
          />
        )}
      </Modal>
      {canDelete && (
        <DeletePhotoLinkModal
          open={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          answerId={answerId}
        />
      )}
    </>
  );
};
