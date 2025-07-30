import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { Box } from '@mui/material';
import { Field, Form, DateField } from '../../../components/Field';
import { TranslatedText, Button, Heading3 } from '../../../components';
import { Colors, FORM_TYPES } from '../../../constants';
import { useCreateUserLeaveMutation } from '../../../api/mutations/useUserLeaveMutation';
import { toast } from 'react-toastify';
import { useTranslation } from '../../../contexts/Translation';
import { useQueryClient } from '@tanstack/react-query';

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

const StyledButton = styled(Button)`
  height: 40px;
  margin-top: auto;
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
  const { getTranslation } = useTranslation();
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
    createLeave(values);
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
                  <TranslatedText stringId="admin.users.leave.endDate.label" fallback="End date" />
                }
                component={DateField}
                saveDateAsString
                min={values.startDate}
                required
              />
              <StyledButton
                onClick={submitForm}
                disabled={!dirty || isCreatingLeave}
                isSubmitting={isCreatingLeave}
              >
                <TranslatedText stringId="admin.users.leave.schedule" fallback="Schedule leave" />
              </StyledButton>
            </DateFieldsContainer>
          );
        }}
      />
    </div>
  );
};
