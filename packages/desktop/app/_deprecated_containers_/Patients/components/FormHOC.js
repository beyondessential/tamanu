import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import PropTypes from 'prop-types';
import { clone } from 'lodash';
import { bindActionCreators } from 'redux';

export default (ComposedComponent, mapStatetoProps, actionCreators) => {
  class FormHOC extends Component {
    constructor(props) {
      super(props);
      const { dispatch } = props;
      this.boundActionCreators = bindActionCreators(actionCreators, dispatch);
    }

    state = {
      form: this.props.form,
    };

    handleUserInput = (e, field) => {
      const form = clone(this.state.form);
      if (typeof field !== 'undefined') {
        form[field] = e;
      } else {
        const { name } = e.target;
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        form[name] = value;
      }

      this.setState({ form });
    };

    render() {
      return (
        <ComposedComponent
          {...this.props}
          {...this.boundActionCreators}
          {...this.state}
          handleUserInput={this.handleUserInput}
        />
      );
    }
  }

  FormHOC.propTypes = {
    dispatch: PropTypes.func,
    form: PropTypes.object,
  };

  FormHOC.defaultProps = {
    dispatch: () => {},
    form: {},
  };

  return connect(mapStatetoProps)(FormHOC);
};
