import React, { useState } from 'react';

import GetAppIcon from '@material-ui/icons/GetApp';
import { Modal } from '../Modal';
import PDFPreview from './PDFPreview';
import PhotoPreview from './PhotoPreview';
import { Button } from '../Button';

const DownloadButton = ({ onClick }) => {
  return (
    <Button variant="outlined" size="small" startIcon={<GetAppIcon />} onClick={onClick}>
      Download
    </Button>
  );
};

export const DocumentPreviewModal = ({
  open,
  title,
  attachmentId,
  documentType,
  onClose,
  onDownload,
}) => {
  const [scrollPage, setScrollPage] = useState(1);
  const [pageCount, setPageCount] = useState();

  return (
    <Modal
      open={open}
      title={title}
      subtitle={documentType === 'PDF' ? `Page ${scrollPage} of ${pageCount}` : null}
      additionalActions={[<DownloadButton onClick={onDownload} key="Download" />]}
      onClose={() => {
        setScrollPage(1);
        onClose();
      }}
    >
      {documentType === 'PDF' ? (
        <PDFPreview
          attachmentId={attachmentId}
          pageCount={pageCount}
          setPageCount={setPageCount}
          scrollPage={scrollPage}
          setScrollPage={setScrollPage}
        />
      ) : (
        <PhotoPreview attachmentId={attachmentId} />
      )}
    </Modal>
  );
};
