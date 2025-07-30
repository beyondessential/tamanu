import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { Box, Divider } from '@mui/material';
import { Field, Form, DateField } from '../../../components/Field';
import { TranslatedText, Button, Heading3, BodyText } from '../../../components';
import { Colors, FORM_TYPES } from '../../../constants';
import { useCreateUserLeaveMutation } from '../../../api/mutations/useUserLeaveMutation';
import { useUserLeavesQuery } from '../../../api/queries/useUserLeaveQuery';
import { toast } from 'react-toastify';
import { useTranslation } from '../../../contexts/Translation';
import { format } from 'date-fns';
import { useApi } from '../../../api/useApi';
import { useQueryClient } from '@tanstack/react-query';

const SectionSubtitle = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.midText};
  margin-bottom: 20px;
`;

const DateFieldsContainer = styled(Box)`
  display: flex;
  gap: 16px;
  align-items: flex-end;
`;

const DateFieldWrapper = styled(Box)`
  flex: 1;
`;

const ButtonWrapper = styled(Box)`
  display: flex;
  align-items: flex-end;
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

const RemoveLink = styled(Box)`
  color: ${Colors.darkestText};
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
`;

const validationSchema = yup.object().shape({
  startDate: yup.string().required('Start date is required'),
  endDate: yup.string().required('End date is required'),
});

export const UserLeaveSection = ({ user }) => {
  const { getTranslation } = useTranslation();
  const api = useApi();
  const queryClient = useQueryClient();

  const { mutate: createLeave, isLoading: isCreatingLeave } = useCreateUserLeaveMutation(user.id, {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['userLeaves', user.id],
      });
      toast.success(getTranslation('admin.users.leave.success', 'Leave scheduled successfully!'));
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleDeleteLeave = leaveId => {
    api
      .delete(`admin/users/${user.id}/leaves/${leaveId}`)
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ['userLeaves', user.id],
        });
        toast.success(
          getTranslation('admin.users.leave.deleteSuccess', 'Leave removed successfully!'),
        );
      })
      .catch(error => {
        toast.error(error.message);
      });
  };

  const { data: leavesData } = useUserLeavesQuery(user.id);
  const leaves = leavesData || [];

  const handleSubmit = async values => {
    if (new Date(values.endDate) < new Date(values.startDate)) {
      toast.error('End date must be greater than or equal to start date');
      return;
    }
    createLeave(values);
  };

  const formatDate = dateString => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
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
        render={({ submitForm, dirty, values }) => {
          return (
            <DateFieldsContainer>
              <DateFieldWrapper>
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
              </DateFieldWrapper>
              <DateFieldWrapper>
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
              </DateFieldWrapper>
              <ButtonWrapper>
                <Button
                  onClick={submitForm}
                  disabled={!dirty || isCreatingLeave}
                  isSubmitting={isCreatingLeave}
                >
                  <TranslatedText stringId="admin.users.leave.schedule" fallback="Schedule leave" />
                </Button>
              </ButtonWrapper>
            </DateFieldsContainer>
          );
        }}
      />
      {leaves.length > 0 && (
        <>
          <Box mt="20px" mb="20px">
            <Divider sx={{ borderColor: Colors.outline }} />
          </Box>
          <BodyText mb="4px" fontWeight="500" color={Colors.darkText}>
            <TranslatedText
              stringId="admin.users.leave.upcoming.title"
              fallback="Upcoming scheduled leave"
            />
          </BodyText>
          <LeaveListContainer>
            {leaves
              .filter(leave => !leave.removedAt)
              .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
              .map(leave => (
                <LeaveItem key={leave.id}>
                  <LeaveDates>
                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                  </LeaveDates>
                  <RemoveLink onClick={() => handleDeleteLeave(leave.id)}>
                    <TranslatedText stringId="general.action.remove" fallback="Remove" />
                  </RemoveLink>
                </LeaveItem>
              ))}
          </LeaveListContainer>
        </>
      )}
    </div>
  );
};
