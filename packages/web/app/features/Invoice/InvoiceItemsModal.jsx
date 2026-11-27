import React from 'react';
import styled from 'styled-components';
import Typography from '@mui/material/Typography';

import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { useSectionName, useSectionPeriodText } from './InvoiceForm/SectionTitle';
import { InvoiceForm } from './InvoiceForm';

const ModalBody = styled.div`
  padding: 20px 8px 0;
`;

const Description = styled(Typography)`
  &.MuiTypography-root {
    font-size: 14px;
    margin-block-end: 20px;
  }
`;

// The window names the section it was opened from, and its date range where the facility holds
// one, so the dates the form will hold the new line to are read before the line is started.
const SectionDescription = ({ section }) => {
  const sectionName = useSectionName();
  const sectionPeriodText = useSectionPeriodText();
  const period = sectionPeriodText(section);
  return period ? (
    <TranslatedText
      stringId="invoice.modal.addItems.description"
      fallback="Add items to :section (:period) below"
      replacements={{ section: sectionName(section), period }}
    />
  ) : (
    <TranslatedText
      stringId="invoice.modal.addItems.description.noPeriod"
      fallback="Add items to :section below"
      replacements={{ section: sectionName(section) }}
    />
  );
};

export const InvoiceItemsModal = ({ open, onClose, invoice, title, invoiceFormType, section }) => {
  return (
    <Modal title={title} open={open} onClose={onClose} width="lg">
      <ModalBody>
        <Description>
          {section ? (
            <SectionDescription section={section} />
          ) : (
            <TranslatedText
              stringId="invoice.modal.edit.description"
              fallback="Edit invoice items below"
            />
          )}
        </Description>
        <InvoiceForm
          invoice={invoice}
          invoiceFormType={invoiceFormType}
          onClose={onClose}
          section={section}
        />
      </ModalBody>
    </Modal>
  );
};
