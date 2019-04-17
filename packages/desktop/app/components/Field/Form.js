import React from 'react';
import { Formik, Field as FormikField, connect } from 'formik';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import { Dialog } from '../Dialog';

const ErrorMessage = ({ errors, name }) => `${name} ${errors[name]}`;

const FormErrors = ({ errors }) => Object.keys(errors).map(name => (
  <Typography key={name} variant="subtitle2">
    <ErrorMessage errors={errors} name={name} />
  </Typography>
));

export const Field = connect(({ formik: { errors }, name, ...props }) => {
  const errorProps = {};
  if (errors[name]) {
    errorProps.error = true;
    errorProps.helperText = <ErrorMessage errors={errors} name={name} />;
  }
  return (
    <FormikField {...props} {...errorProps} name={name} />
  );
});

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

  handleSubmit = ({ validateForm, handleSubmit, isSubmitting }) => async event => {
    if (event) {
      event.preventDefault();
      event.persist();
    }
    const formErrors = await validateForm();
    if (Object.entries(formErrors).length) return this.setErrors(formErrors);
    // avoid multiple submissions
    // `submitForm()` can be used but `handleSubmit()`
    // will take care of `isSubmitting` and other props
    if (!isSubmitting) handleSubmit(event);
  }

  render() {
    const {
      onSubmit, render, showInlineErrorsOnly, ...props
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
          render={({
            isValid, isSubmitting, validateForm, handleSubmit,
            submitForm: originalSubmitForm, ...formProps
          }) => {
            // we need to expose this func for nested forms
            // use originalSubmitForm() to display only inline error messages
            // use handleSubmit() to display error messages in a popup
            const submitForm = showInlineErrorsOnly
              ? originalSubmitForm
              : this.handleSubmit({ validateForm, handleSubmit, isSubmitting });
            return (
              <form onSubmit={submitForm} noValidate>
                {render({
                  ...formProps, isValid, isSubmitting, submitForm,
                })}
              </form>
            );
          }}
          {...props}
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
