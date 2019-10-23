import React from 'react';
import { Formik, Field as FormikField, connect as formikConnect } from 'formik';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import { Dialog } from '../Dialog';

function stripNestedRealmObjects(data) {
  // Realm allows deep-editing of objects, but the way we send data to the server
  // opens up some undesirable side-effects.
  // If we've got a patientDiagnosis object that looks like this:
  // { _id: "base-object-123", diagnosis: { _id: "sick-123", name: "Sick" } }
  // and the user edits it, selecting a different malady, the autocomplete will
  // write to diagnosis._id:
  // { _id: "base-object-123", diagnosis: { _id: "injured-123", name: "Sick" } }
  // When this arrives at the server, realm will update the patientDiagnosis to
  // reference the "injured-123" diagnosis, but will _also_ rewrite that diagnosis'
  // name to be "Sick" instead of what it previously was - presumably "Injured".
  //
  // So, this function iterates over the keys of an object and updates any nested
  // objects to only have the _id key:
  // { _id: "base-object-123", diagnosis: { _id: "sick-123" } }

  // first create a shallow copy of the object
  const strippedValues = { ...data };

  const strip = value => {
    if (value && value._id) return { _id: value._id };
    if (Array.isArray(value)) return value.map(strip);
    return value;
  };

  // then replace deep FK references with shallow ones
  // eslint-disable-next-line array-callback-return
  Object.entries(strippedValues).map(([key, value]) => {
    strippedValues[key] = strip(value);
  });

  return strippedValues;
}

const ErrorMessage = ({ errors, name }) => `${errors[name]}`;

const FormErrors = ({ errors }) =>
  Object.keys(errors).map(name => (
    <Typography key={name} variant="subtitle2">
      <ErrorMessage errors={errors} name={name} />
    </Typography>
  ));

export const Field = formikConnect(({ formik: { errors }, name, helperText, ...props }) => (
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
  };

  static defaultProps = {
    showInlineErrorsOnly: false,
  };

  state = {
    validationErrors: {},
    isErrorDialogVisible: false,
  };

  setErrors = validationErrors => {
    this.setState({ validationErrors, isErrorDialogVisible: true });
  };

  hideErrorDialog = () => {
    this.setState({ isErrorDialogVisible: false });
  };

  createSubmissionHandler = ({
    validateForm,
    handleSubmit,
    isSubmitting,
    setSubmitting,
    values,
    ...rest
  }) => async event => {
    event.preventDefault();
    event.persist();

    // avoid multiple submissions
    if (isSubmitting) {
      return;
    }

    setSubmitting(true);

    // validation phase
    const formErrors = await validateForm();
    if (Object.entries(formErrors).length) {
      this.setErrors(formErrors);
      setSubmitting(false);
      return;
    }

    // submission phase
    const strippedValues = stripNestedRealmObjects(values);
    const { onSubmit } = this.props;
    try {
      await onSubmit(strippedValues, {
        ...rest,
        setErrors: this.setErrors,
      });
    } catch (e) {
      console.error('Error submitting form: ', e);
    }

    setSubmitting(false);
  };

  renderFormContents = ({
    isValid,
    isSubmitting,
    submitForm: originalSubmitForm,
    ...formProps
  }) => {
    // we need this func for nested forms
    // as the original submitForm() will trigger validation automatically
    const submitForm = this.createSubmissionHandler({
      isSubmitting,
      ...formProps,
    });

    const { render } = this.props;

    return (
      <form onSubmit={submitForm} noValidate>
        {render({
          ...formProps,
          isValid,
          isSubmitting,
          submitForm,
        })}
      </form>
    );
  };

  render() {
    const { onSubmit, showInlineErrorsOnly, ...props } = this.props;
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
          contentText={<FormErrors errors={validationErrors} />}
        />
      </React.Fragment>
    );
  }
}
