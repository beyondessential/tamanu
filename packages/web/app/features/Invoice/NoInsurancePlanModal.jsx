import React from 'react';
import styled from 'styled-components';

import { Button, OutlinedButton } from '@tamanu/ui-components';

import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { ConfirmRowDivider } from '../../components/ConfirmRowDivider';
import { Colors } from '../../constants';

const Content = styled.div`
  margin-block: 56px;
  font-size: 14px;
  line-height: 1.4;
  color: ${Colors.darkestText};
`;

// Go back sits apart from the two ways forward, which group together on the right.
const ActionRow = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  width: 100%;
`;

const ForwardActions = styled.div`
  display: flex;
  gap: 20px;
`;

/**
 * Checks that recording a payment against an invoice with no insurance plan is deliberate, since a
 * plan applied afterwards changes what the patient owes. `onAddInsurancePlan` is offered only where
 * a plan can still be added to this invoice.
 */
export const NoInsurancePlanModal = ({ open, onClose, onAddInsurancePlan, onContinue }) => (
  <Modal
    open={open}
    onClose={onClose}
    width="md"
    title={
      <TranslatedText
        stringId="invoice.modal.noInsurancePlan.title"
        fallback="No insurance plan added"
      />
    }
  >
    <Content>
      <p>
        <TranslatedText
          stringId="invoice.modal.noInsurancePlan.text"
          fallback="No insurance plan has been added to this invoice yet. Insurance plans affect the patient amount that is due."
        />
      </p>
      <p>
        <TranslatedText
          stringId="invoice.modal.noInsurancePlan.confirmation"
          fallback="Are you sure you would like to continue?"
        />
      </p>
    </Content>
    <ConfirmRowDivider />
    <ActionRow>
      <OutlinedButton onClick={onClose}>
        <TranslatedText stringId="general.action.goBack" fallback="Go back" />
      </OutlinedButton>
      <ForwardActions>
        {onAddInsurancePlan && (
          <OutlinedButton onClick={onAddInsurancePlan}>
            <TranslatedText
              stringId="invoice.action.addInsurancePlan"
              fallback="Add insurance plan"
            />
          </OutlinedButton>
        )}
        <Button onClick={onContinue}>
          <TranslatedText
            stringId="invoice.action.continueWithoutInsurancePlan"
            fallback="Continue without insurance plan"
          />
        </Button>
      </ForwardActions>
    </ActionRow>
  </Modal>
);
