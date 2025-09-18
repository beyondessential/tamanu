import React, { useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { Box, Divider } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { formatShort } from '@tamanu/utils/dateTime';
import { toast } from 'react-toastify';
import { Button, TranslatedText, FormSubmitButton, Form, Field } from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants';
import { Heading3, BodyText } from '../../../components/Typography';
import { DateField } from '../../../components/Field';
import { Colors } from '../../../constants';
import {
  useCreateUserLeaveMutation,
  useDeleteUserLeaveMutation,
} from '../../../api/mutations/useUserLeaveMutation';
import { useUserLeavesQuery } from '../../../api/queries/useUserLeaveQuery';
import { useTranslation } from '../../../contexts/Translation';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useAuth } from '../../../contexts/Auth';

const SectionSubtitle = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.midText};
  margin-bottom: 20px;
`;

const DateFieldsContainer = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 1fr 135px;
  column-gap: 16px;
`;

const LeaveListContainer = styled(Box)`
  height: 92px;
  overflow-y: auto;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  padding: 12px 20px;
  background-color: ${Colors.white};
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const LeaveItem = styled(Box)`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const LeaveDates = styled(Box)`
  font-size: 14px;
  color: ${Colors.darkestText};
  font-weight: 500;
`;

const StyledButton = styled(Button)`
  height: 40px;
  margin-top: auto;
`;

const RemoveLink = styled(Box)`
  color: ${Colors.darkestText};
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
`;

const ConfirmModalContent = styled(Box)`
  margin-top: 12px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledFormSubmitButton = styled(FormSubmitButton)`
  height: 40px;
  width: 123px;
  white-space: nowrap;
`;

const validationSchema = yup.object().shape({
  startDate: yup
    .string()
    .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />),
  endDate: yup
    .string()
    .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />),
});

export const UserLeaveSection = ({ user }) => {
  const { ability } = useAuth();
  const canUpdateUser = ability.can(
    'write',
    new (function User() {
      this.id = user.id;
    })(),
  );
  const { getTranslation } = useTranslation();
  const queryClient = useQueryClient();
  const [leaveToDelete, setLeaveToDelete] = useState(null);

  const { mutateAsync: createLeave, isLoading: isCreatingLeave } = useCreateUserLeaveMutation(
    user.id,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['userLeaves', user.id],
        });
        toast.success(getTranslation('admin.users.leave.success', 'Leave scheduled successfully!'));
      },
      onError: error => {
        toast.error(error.message);
      },
    },
  );

  const { mutateAsync: deleteLeave, isLoading: isDeletingLeave } = useDeleteUserLeaveMutation(
    user.id,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['userLeaves', user.id],
        });
        toast.success(
          getTranslation('admin.users.leave.deleteSuccess', 'Leave removed successfully!'),
        );
        setLeaveToDelete(null);
      },
      onError: error => {
        toast.error(error.message);
      },
    },
  );

  const handleDeleteLeave = leave => {
    setLeaveToDelete(leave);
  };

  const confirmDeleteLeave = async () => {
    if (isDeletingLeave || !leaveToDelete) return;
    await deleteLeave(leaveToDelete.id);
  };

  const cancelDeleteLeave = () => {
    setLeaveToDelete(null);
  };

  const { data: leavesData } = useUserLeavesQuery(user.id);
  const leaves = leavesData || [];

  const handleSubmit = async values => {
    if (new Date(values.endDate) < new Date(values.startDate)) {
      toast.error(
        getTranslation(
          'admin.users.leave.endDate.error',
          'End date must be greater than or equal to start date',
        ),
      );
      return;
    }
    await createLeave(values);
  };

  const initialValues = {
    startDate: '',
    endDate: '',
  };

  return (
    <div>
      <Heading3 mt="20px" mb="10px">
        <TranslatedText stringId="admin.users.leave.title" fallback="Schedule leave" />
      </Heading3>
      {canUpdateUser && (
        <>
          <SectionSubtitle>
            <TranslatedText
              stringId="admin.users.leave.subtitle"
              fallback="Schedule leave for user using the fields below. These dates will be reflected in the location assignment schedule by removing the user from any assigned locations on these dates if applicable."
            />
          </SectionSubtitle>

          <Form
            suppressErrorDialog
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            formType={FORM_TYPES.CREATE_FORM}
            render={({ submitForm, values, resetForm }) => {
              const { startDate, endDate } = values;
              return (
                <DateFieldsContainer>
                  <Field
                    name="startDate"
                    label={
                      <TranslatedText
                        stringId="admin.users.leave.startDate.label"
                        fallback="Start date"
                      />
                    }
                    component={DateField}
                    saveDateAsString
                    required
                  />
                  <Field
                    name="endDate"
                    label={
                      <TranslatedText
                        stringId="admin.users.leave.endDate.label"
                        fallback="End date"
                      />
                    }
                    component={DateField}
                    saveDateAsString
                    min={values.startDate}
                    required
                  />
                  <StyledButton
                    onClick={async e => {
                      await submitForm(e);
                      resetForm();
                    }}
                    disabled={!startDate || !endDate || isCreatingLeave}
                    isSubmitting={isCreatingLeave}
                  >
                    <TranslatedText
                      stringId="admin.users.leave.schedule"
                      fallback="Schedule leave"
                    />
                  </StyledButton>
                </DateFieldsContainer>
              );
            }}
          />
        </>
      )}

      {leaves.length > 0 && (
        <>
          {canUpdateUser && (
            <Box mt="20px" mb="20px">
              <Divider sx={{ borderColor: Colors.outline }} />
            </Box>
          )}
          <BodyText mb="4px" fontWeight="500" color={Colors.darkText}>
            <TranslatedText
              stringId="admin.users.leave.upcoming.title"
              fallback="Upcoming scheduled leave"
            />
          </BodyText>
          <LeaveListContainer>
            {leaves
              .map(leave => (
                <LeaveItem key={leave.id}>
                  <LeaveDates>
                    {formatShort(leave.startDate)} - {formatShort(leave.endDate)}
                  </LeaveDates>
                  {canUpdateUser && (
                    <RemoveLink onClick={() => handleDeleteLeave(leave)}>
                      <TranslatedText stringId="general.action.remove" fallback="Remove" />
                    </RemoveLink>
                  )}
                </LeaveItem>
              ))}
          </LeaveListContainer>
        </>
      )}

      <ConfirmModal
        open={!!leaveToDelete}
        onCancel={cancelDeleteLeave}
        onConfirm={confirmDeleteLeave}
        title={<TranslatedText stringId="admin.users.leave.delete.title" fallback="Remove leave" />}
        customContent={
          <ConfirmModalContent>
            <TranslatedText
              stringId="admin.users.leave.delete.confirmation"
              fallback="Are you sure you would like to remove assigned leave from this users profile?"
            />
          </ConfirmModalContent>
        }
        cancelButtonText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
        ConfirmButton={props => (
          <StyledFormSubmitButton
            disabled={isDeletingLeave}
            showLoadingIndicator={isDeletingLeave}
            {...props}
          >
            <TranslatedText stringId="admin.users.leave.delete.confirm" fallback="Remove leave" />
          </StyledFormSubmitButton>
        )}
      />
    </div>
  );
};
