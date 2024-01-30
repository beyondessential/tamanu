import React from 'react';
import styled from 'styled-components';

import { BaseModal } from "./BaseModal";
import { Field, SelectField } from './Field';
import { ModalBackCancelConfirmRow } from "./ModalActionRow";

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
        flex: 1;
    }
`;

export const AddReminderContactModal = ({ openAddReminderContactModal, handleCloseAddReminder, handleBackAddReminder, patient = {} }) => {

    return (
        <BaseModal
            width="md"
            title="Add reminder contact"
            open={openAddReminderContactModal}
            onClose={handleCloseAddReminder}
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
                    options={[{
                        label: 'site',
                        value: 'site',
                    }]}
                    required={true}
                />
            </StyledTextField>

            <StyledText className='bottomText'>Connect using the QR code on the following screen.</StyledText>
            <ModalBackCancelConfirmRow onBack={handleBackAddReminder} confirmText="Confirm & connect" confirmColor="primary" onConfirm={handleCloseAddReminder} onCancel={handleCloseAddReminder} />
        </BaseModal>
    );
};