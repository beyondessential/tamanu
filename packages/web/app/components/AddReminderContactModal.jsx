import React from 'react';
import styled from 'styled-components';

import { BaseModal } from "./BaseModal";
import { ModalActionRow, ModalCancelRow } from "./ModalActionRow";
import { Field,SelectField,TextInput } from './Field';

export const AddReminderContactModal = ({ openAddReminderContactModal, handleClose, patient={} }) => {
    
    const StyledText = styled.p`
        margin: 0;
        font-size: 14px;
        line-height: 18px;

        span {
            font-weight: 500;
        }
    
        &.headerText {
            margin: 7px 0 9px 0;
            font-weight: 500;
        }

        &.bottomText {
            margin-bottom: 31px;
            font-weight: 500;
        }
    `;

    const StyledTextField = styled.div`
        display: flex;
        gap: 20px;
        margin-top: 20px;
        margin-bottom: 38px;

        > div {
            flex-grow: 1;
        }
    `;

    return (
      <BaseModal
        width="md"
        title="Add reminder contact"
        open={openAddReminderContactModal}
        cornerExitButton={false}
      >

        <StyledText className='headerText'>Please provide details below to add a new contact.</StyledText>
        <StyledText>By providing their details, the individual consents to receiving automated reminder messages for <span>{patient.firstName} {patient.lastName}</span></StyledText>

        <StyledTextField>
            <Field
                name={"Contact name"}
                label="Contact name"
                required={true}
            />

            <Field
                name={"Relationship"}
                label="Relationship"
                component={SelectField}
                options={[{label: 'site',
                    value: 'site',}]}
                required={true}
            />
        </StyledTextField>

        <StyledText className='bottomText'>Connect using the QR code on the following screen.</StyledText>
        <ModalActionRow confirmText="Confirm & connect" confirmColor="primary" onConfirm={handleClose} onCancel={handleClose}/>
      </BaseModal>
    );
  };