import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Autocomplete from 'react-autocomplete';
import Select from 'react-select';
import { map, template, isEmpty } from 'lodash';
import { PatientsCollection } from '../collections';
import { PatientModel } from '../models';

class PatientRelationSelect extends Component {
  static propTypes = {
    patient: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    relation: PropTypes.string.isRequired,
    tmpl: PropTypes.func.isRequired,
    label: PropTypes.string.isRequired,
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
    simpleValue: PropTypes.bool,
    onChange: PropTypes.func,
  }

  static defaultProps = {
    required: false,
    className: '',
    simpleValue: true,
    onChange: () => {},
    value: '',
  }

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    options: []
  }

  async componentWillMount() {
    const { patient, relation, tmpl, value: _id } = this.props;
    let Model;
    if (typeof patient === "string") {
      this.props.model.set({ _id: patient });
      await this.props.model.fetch({ relations: [relation] });
      Model = this.props.model;
    } else {
      Model = patient;
    }
    let options = Model.get(relation).toJSON();
    options = options.map(item => ({ value: item._id, label: tmpl(item) }) );
    this.setState({ options });
  }

  handleChange(value) {
    const { onChange } = this.props;
    if (onChange) onChange(value);
    this.setState({ value });
  }

  render() {
    const {
      label,
      required,
      name,
      className,
      simpleValue,
    } = this.props;
    const { options, value } = this.state;
    return (
      <div className={`column ${className}`}>
        <span className="input-group-title">
          {label} {required && <span className="isRequired">*</span>}
        </span>
        <Select
          options={options}
          name={name}
          value={value}
          onChange={this.handleChange.bind(this)}
          simpleValue={simpleValue}
          required
        />
      </div>
    );
  }
}

const mapDispatchToProps = () => ({
  model: new PatientModel(),
});

function mapStateToProps(state) {
  return {
    currentPath: state.router.location.pathname,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PatientRelationSelect);
