import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { useApi } from '../api';
import { getImageSourceFromData } from '../utils';
import { Modal } from './Modal';
import { Button, OutlinedButton, TextButton } from './Button';
import { TranslatedText } from './Translation/TranslatedText';
import { ButtonRow } from './ButtonRow';
import { Divider } from '@material-ui/core';
import { LoadingIndicator } from './LoadingIndicator';

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
  const RowComponent = hasError ? ButtonRow : SpaceBetweenButtonRow;
  return (
    <>
      <Divider style={{ margin: '32px -32px 30px -32px' }} data-testid="divider-ib6q" />
      <RowComponent>
        {!hasError && (
          <OutlinedButton onClick={onDelete} data-testid="outlinedbutton-y5xo">
            <TranslatedText
              stringId="general.action.delete"
              fallback="Delete"
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

export const ViewPhotoLink = ({ imageId, chartTitle = null }) => {
  const [showModal, setShowModal] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const api = useApi();
  const openModalCallback = useCallback(async () => {
    setShowModal(true);
    if (!navigator.onLine) {
      setImageData(null);
      setErrorMessage(
        'You do not currently have an internet connection. Images require live internet for viewing.',
      );
      return;
    }

    try {
      const { data } = await api.get(`attachment/${imageId}`, { base64: true });
      setImageData(data);
      setErrorMessage(null);
    } catch (error) {
      setImageData(null);
      setErrorMessage(`Error: ${error.message}`);
    }
  }, [api, imageId]);
  const isChartView = !!chartTitle;
  const title = isChartView ? `${chartTitle} | View image` : 'Image';

  return (
    <>
      <TextButton color="blue" onClick={openModalCallback} data-testid="textbutton-p17p">
        <TextDisplay isChartView={isChartView} />
      </TextButton>
      <Modal
        title={title}
        open={showModal}
        onClose={() => setShowModal(false)}
        data-testid="modal-zpy7"
      >
        <ImageModalContent imageData={imageData} errorMessage={errorMessage} />
        {isChartView && (
          <Footer
            hasError={!!errorMessage}
            onDelete={() => {}}
            onClose={() => setShowModal(false)}
          />
        )}
      </Modal>
    </>
  );
};
