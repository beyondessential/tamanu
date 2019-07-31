import React from 'react';
import { Formik, Field as FormikField, connect as formikConnect } from 'formik';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import { Dialog } from '../Dialog';

const ErrorMessage = ({ errors, name }) => `${name} ${errors[name]}`;

const FormErrors = ({ errors }) => Object.keys(errors).map(name => (
  <Typography key={name} variant="subtitle2">
    <ErrorMessage errors={errors} name={name} />
  </Typography>
));

export const Field = formikConnect(({ 
  formik: { errors }, 
  name, 
  helperText,
  ...props
}) => (
  <FormikField
    {...props} 
    error={!!errors[name]}
    helperText={errors[name] || helperText}
    name={name} 
  />
));

export class Form extends React.PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    render: PropTypes.func.isRequired,
    showInlineErrorsOnly: PropTypes.bool,
  }

  static defaultProps = {
    showInlineErrorsOnly: false,
  }

  state = {
    validationErrors: {},
    isErrorDialogVisible: false,
  }

  setErrors(validationErrors) {
    this.setState({ validationErrors, isErrorDialogVisible: true });
  }

  hideErrorDialog = () => {
    this.setState({ isErrorDialogVisible: false });
  }

  createSubmissionHandler = ({
    validateForm, handleSubmit, isSubmitting,
  }) => async event => {
    event.preventDefault();
    event.persist();
    const formErrors = await validateForm();
    if (Object.entries(formErrors).length) return this.setErrors(formErrors);
    // avoid multiple submissions
    // `submitForm()` can be used but `handleSubmit()`
    // will take care of `isSubmitting` and other props
    if (!isSubmitting) handleSubmit(event);
  }

  renderFormContents = ({
    isValid,
    isSubmitting,
    validateForm,
    handleSubmit,
    submitForm: originalSubmitForm,
    ...formProps
  }) => {
    // we need this func for nested forms
    // as the original submitForm() will trigger validation automatically
    const submitForm = this.createSubmissionHandler({
      validateForm,
      handleSubmit,
      isSubmitting,
    });

    const { render } = this.props;

    return (
      <form onSubmit={submitForm} noValidate>
        {render({
          ...formProps, isValid, isSubmitting, submitForm 
        })}
      </form>
    );
  };

  render() {
    const {
      onSubmit, 
      showInlineErrorsOnly, 
      ...props
    } = this.props;
    const { validationErrors, isErrorDialogVisible } = this.state;

    // read children from additional props rather than destructuring so
    // eslint ignores it (there's not good support for "forbidden" props)
    if (props.children) {
      throw new Error('Form must not have any children -- use the `render` prop instead please!');
    }

    return (
      <React.Fragment>
        <Formik
          onSubmit={onSubmit}
          validateOnChange={false}
          validateOnBlur={false}
          initialStatus={{
            page: 1,
          }}
          {...props}
          render={this.renderFormContents}
        />

        <Dialog
          isVisible={isErrorDialogVisible}
          onClose={this.hideErrorDialog}
          headerTitle="Please fix below errors to continue"
          contentText={(
            <FormErrors errors={validationErrors} />
          )}
        />
      </React.Fragment>
    );
  }
}
