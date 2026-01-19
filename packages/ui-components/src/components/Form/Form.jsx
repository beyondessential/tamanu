import React, { isValidElement, useEffect } from 'react';
import { Formik, useFormikContext } from 'formik';
import { ValidationError } from 'yup';
import { Typography } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import styled from 'styled-components';

import { flattenObject } from './flattenObject';
import { Dialog } from '../Dialog';
import { FORM_TYPES, SUBMIT_ATTEMPTED_STATUS } from '@tamanu/constants/forms';
import { useFormSubmission } from '../../contexts/FormSubmissionContext';
import { IS_DEVELOPMENT } from '../../utils/env';
import { TranslatedText } from '../Translation';

const ErrorMessage = ({ error }) => {
  if (isValidElement(error)) return error;
  return `${JSON.stringify(error)}`;
};

const FormErrors = ({ errors }) => {
  const allErrors = flattenObject(errors);

  return Object.entries(allErrors).map(
    ([name, error], index) =>
      error && (
        <Typography key={name} variant="subtitle2" data-testid={`typography-vmhk-${index}`}>
          <ErrorMessage error={error} data-testid={`errormessage-sjd4-${index}`} />
        </Typography>
      ),
  );
};

const ScrollToError = () => {
  const formik = useFormikContext();
  const submitting = formik?.isSubmitting;

  useEffect(() => {
    const el = document?.querySelector('.Mui-error, [data-error]');
    const element = el?.parentElement ?? el;

    if (element) {
      element.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [submitting]);
  return null;
};

const StyledForm = styled.form`
  ${props =>
    !props.$clickable
      ? `
      .MuiFormControl-root {
        pointer-events: none;
      }
    `
      : ''}
`;

const FormSubmissionFlag = () => {
  const { isSubmitting } = useFormikContext();
  const { setIsClosable, setHasFormSubmission } = useFormSubmission();

  useEffect(() => {
    setHasFormSubmission(true);
    // we only want to flag this once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setIsClosable(!isSubmitting);
    // we only want to set isClosable when isSubmitting is changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting]);

  return null;
};

export class Form extends React.PureComponent {
  constructor(props) {
    super(props);

    const { onSubmit, formType } = props;
    const hasNonAsyncSubmitHandler =
      IS_DEVELOPMENT &&
      formType !== FORM_TYPES.SEARCH_FORM &&
      onSubmit.constructor.name !== 'AsyncFunction';

    this.state = {
      validationErrors: {},
      showWarningForNonAsyncSubmitHandler: hasNonAsyncSubmitHandler,
    };
  }

  setErrors = validationErrors => {
    const { onError = null, showInlineErrorsOnly = false } = this.props;
    if (onError) {
      onError(validationErrors);
    }

    if (showInlineErrorsOnly) {
      // If validationErrors, only show form level errors in the Error Dialog
      if (validationErrors?.form) {
        this.setState({
          validationErrors: {
            form: validationErrors.form,
          },
        });
      }
    } else {
      this.setState({ validationErrors });
    }
  };

  hideErrorDialog = () => {
    this.setState({ validationErrors: {} });
  };

  createSubmissionHandler =
    ({ validateForm, isSubmitting, setSubmitting, getValues, setStatus, status, ...rest }) =>
    async (event, submissionParameters, componentsToValidate) => {
      delete rest.handleSubmit;

      event.preventDefault();
      event.persist();

      // Use formik status prop to track if the user has attempted to submit the form. This is used in
      // Field.js to only show error messages once the user has attempted to submit the form
      setStatus({ ...status, submitStatus: SUBMIT_ATTEMPTED_STATUS });

      // avoid multiple submissions
      if (isSubmitting) {
        return null;
      }
      setSubmitting(true);
      const values = { ...getValues(), ...submissionParameters };

      // validation phase

      // There is a bug in formik when you have validateOnChange set to true and validate manually as
      // well where it adds { isCanceled: true } to the errors so a work around is to manually remove it.
      // @see https://github.com/jaredpalmer/formik/issues/1209
      console.log('validateForm...');
      const formErrors = await validateForm(values);
      console.log('validateForm', formErrors);
      delete formErrors.isCanceled;

      const validFormErrors = componentsToValidate
        ? Object.keys(formErrors || {}).filter(problematicComponent =>
            componentsToValidate.has(problematicComponent),
          )
        : formErrors;

      if (Object.keys(validFormErrors).length > 0) {
        this.setErrors(validFormErrors);
        // Set submitting false before throwing the error so that the form is reset
        // for future form submissions
        setSubmitting(false);
        throw new ValidationError('Form was not filled out correctly');
      }

      // submission phase
      const { onSubmit, onSuccess = null, formType } = this.props;
      const { touched } = rest;
      const newValues = { ...values };

      // If it is a data form i.e not search form, before submission, convert all the touched undefined values
      // to null because
      // 1. If it is an edit submit form, we need to be able to save the cleared values as null in the database if we are
      // trying to remove a value when editing a record
      // 2. If it is a new submit form, it does not matter if the empty value is undefined or null
      if (formType !== FORM_TYPES.SEARCH_FORM) {
        for (const key of Object.keys(touched)) {
          if (newValues[key] === undefined) {
            newValues[key] = null;
          }
        }
      }

      try {
        const result = await onSubmit(newValues, {
          ...rest,
          setErrors: this.setErrors,
        });
        if (onSuccess) {
          onSuccess(result);
        }
        return result;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error during form submission: ', e);
        this.setErrors({ form: e.message });
        throw e;
      } finally {
        setSubmitting(false);
      }
    };

  renderFormContents = ({ isValid, isSubmitting, setValues: originalSetValues, ...formProps }) => {
    delete formProps.submitForm;
    let { values } = formProps;

    // we need this func for nested forms
    // as the original submitForm() will trigger validation automatically
    const submitForm = this.createSubmissionHandler({
      isSubmitting,
      getValues: () => values,
      ...formProps,
    });

    // if setValues is called, we need to update the values that the submission handler uses so that
    // it can be called immediately afterwards (i.e. setValues has a synchronous effect)
    const setValues = newValues => {
      values = newValues;
      originalSetValues(newValues);
    };

    const { render, style, className } = this.props;
    const { showWarningForNonAsyncSubmitHandler } = this.state;

    return (
      <>
        {/* do not allow editing fields when form is being submitted */}
        <StyledForm
          className={className}
          style={style}
          onSubmit={submitForm}
          noValidate
          $clickable={!isSubmitting}
          data-testid="styledform-5o5i"
        >
          {/*{showWarningForNonAsyncSubmitHandler && (*/}
          {/*  <Alert*/}
          {/*    severity="warning"*/}
          {/*    onClose={() => this.setState({ showWarningForNonAsyncSubmitHandler: false })}*/}
          {/*    data-testid="alert-ygcm"*/}
          {/*  >*/}
          {/*    <AlertTitle data-testid="alerttitle-3i79">*/}
          {/*      DEV Warning: this form does not have async onSubmit (ignore if intentional)*/}
          {/*    </AlertTitle>*/}
          {/*  </Alert>*/}
          {/*)}*/}
          {render({
            ...formProps,
            setValues,
            isValid,
            isSubmitting,
            submitForm,
            clearForm: () => formProps.resetForm({}),
          })}
        </StyledForm>
        <ScrollToError data-testid="scrolltoerror-4wl5" />
        <FormSubmissionFlag data-testid="formsubmissionflag-cs54" />
      </>
    );
  };

  // Check if the form has any submission errors
  hasFormError = errors => {
    return errors && typeof errors === 'object' && Object.hasOwn(errors, 'form');
  };

  render() {
    const {
      onSubmit,
      validateOnChange = false,
      validateOnBlur = false,
      initialValues = {},
      formType,
      suppressErrorDialog = true,
      suppressErrorDialogCondition = () => true,
      ...props
    } = this.props;
    delete props.showInlineErrorsOnly;
    delete props.render; // we don't want to pass that to formik

    const { validationErrors } = this.state;

    // read children from additional props rather than destructuring so
    // eslint ignores it (there's not good support for "forbidden" props)
    if (props.children) {
      throw new Error('Form must not have any children -- use the `render` prop instead please!');
    }

    const hasErrors = Object.keys(validationErrors).length > 0;

    return (
      <>
        <Formik
          onSubmit={onSubmit}
          validateOnChange={validateOnChange}
          validateOnBlur={validateOnBlur}
          initialValues={initialValues}
          initialStatus={{
            page: 1,
            formType,
          }}
          {...props}
          data-testid="formik-81z6"
        >
          {this.renderFormContents}
        </Formik>
        {!suppressErrorDialog ||
          !suppressErrorDialogCondition(validationErrors) ||
          (this.hasFormError(validationErrors) && (
            <Dialog
              isVisible={hasErrors}
              onClose={this.hideErrorDialog}
              headerTitle={
                <TranslatedText
                  stringId="general.form.validationError.heading"
                  fallback="Please fix below errors to continue"
                  data-testid="translatedtext-zyuh"
                />
              }
              disableDevWarning
              contentText={<FormErrors errors={validationErrors} data-testid="formerrors-yc9p" />}
              data-testid="dialog-d6dt"
            />
          ))}
      </>
    );
  }
}
