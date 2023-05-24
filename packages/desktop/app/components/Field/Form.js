import React, { useEffect } from 'react';
import { Formik, useFormikContext } from 'formik';
import PropTypes from 'prop-types';
import { ValidationError } from 'yup';
import { Typography } from '@material-ui/core';
import { flattenObject } from '../../utils';
import { Dialog } from '../Dialog';
import { FORM_STATUSES } from '../../constants';
import { ConfirmModal } from '../ConfirmModal';

const ErrorMessage = ({ error }) => `${JSON.stringify(error)}`;

const FormErrors = ({ errors }) => {
  const allErrors = flattenObject(errors);

  return Object.entries(allErrors).map(([name, error]) => (
    <Typography key={name} variant="subtitle2">
      <ErrorMessage error={error} />
    </Typography>
  ));
};

const ScrollToError = () => {
  const formik = useFormikContext();
  const submitting = formik?.isSubmitting;

  useEffect(() => {
    const el = document.querySelector('.Mui-error, [data-error]');
    const element = el?.parentElement ?? el;

    if (element) {
      element.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [submitting]);
  return null;
};

export class Form extends React.PureComponent {
  constructor() {
    super();
    this.state = {
      validationErrors: {},
      confirming: false,
    };
  }

  setErrors = validationErrors => {
    const { onError, showInlineErrorsOnly } = this.props;
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

  createSubmissionHandler = ({
    validateForm,
    handleSubmit,
    isSubmitting,
    setSubmitting,
    getValues,
    setStatus,
    ...rest
  }) => async (event, submissionParameters, componentsToValidate) => {
    event.preventDefault();
    event.persist();

    // Use formik status prop to track if the user has attempted to submit the form. This is used in
    // Field.js to only show error messages once the user has attempted to submit the form
    setStatus(FORM_STATUSES.SUBMIT_ATTEMPTED);

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
    const { isCanceled, ...formErrors } = await validateForm(values);

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
    const { onSubmit, onSuccess } = this.props;
    try {
      const result = await onSubmit(values, {
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

  renderFormContents = ({
    isValid,
    isSubmitting,
    submitForm: originalSubmitForm,
    setValues: originalSetValues,
    ...formProps
  }) => {
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
    const navigateToConfirmModal = () => {
      this.setState({ confirming: true });
    };
    const onBack = () => {
      this.setState({ confirming: false });
    };
    const onConfirm = (...props) => {
      this.setState({ confirming: false });
      submitForm(...props);
    };

    const { render, style, onCancel, confirmModalProps } = this.props;
    const isConfirmNeeded = !!confirmModalProps;
    const { confirming } = this.state;
    return (
      <>
        {isConfirmNeeded && (
          <ConfirmModal
            open={confirming}
            onCancel={onCancel}
            onConfirm={onConfirm}
            onBack={onBack}
            {...confirmModalProps}
          />
        )}
        {!confirming && (
          <form style={style} onSubmit={submitForm} noValidate>
            {render({
              ...formProps,
              setValues,
              isValid,
              isSubmitting,
              submitForm: isConfirmNeeded ? navigateToConfirmModal : submitForm,
              clearForm: () => formProps.resetForm({}),
            })}
          </form>
        )}
        <ScrollToError />
      </>
    );
  };

  render() {
    const {
      onSubmit,
      showInlineErrorsOnly,
      validateOnChange,
      validateOnBlur,
      ...props
    } = this.props;
    const { validationErrors } = this.state;

    // read children from additional props rather than destructuring so
    // eslint ignores it (there's not good support for "forbidden" props)
    if (props.children) {
      throw new Error('Form must not have any children -- use the `render` prop instead please!');
    }

    const displayErrorDialog = Object.keys(validationErrors).length > 0;

    return (
      <>
        <Formik
          onSubmit={onSubmit}
          validateOnChange={validateOnChange}
          validateOnBlur={validateOnBlur}
          initialStatus={{
            page: 1,
          }}
          {...props}
          render={this.renderFormContents}
        />
        <Dialog
          isVisible={displayErrorDialog}
          onClose={this.hideErrorDialog}
          headerTitle="Please fix below errors to continue"
          contentText={<FormErrors errors={validationErrors} />}
        />
      </>
    );
  }
}

Form.propTypes = {
  onError: PropTypes.func,
  onSuccess: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  render: PropTypes.func.isRequired,
  showInlineErrorsOnly: PropTypes.bool,
  initialValues: PropTypes.shape({}),
  validateOnChange: PropTypes.bool,
  validateOnBlur: PropTypes.bool,
};

Form.defaultProps = {
  showInlineErrorsOnly: false,
  onError: null,
  onSuccess: null,
  initialValues: {},
  validateOnChange: false,
  validateOnBlur: false,
};
