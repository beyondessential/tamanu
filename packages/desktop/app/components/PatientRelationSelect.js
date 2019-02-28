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
    patient: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    relation: PropTypes.string.isRequired,
    template: PropTypes.func.isRequired,
    label: PropTypes.string.isRequired,
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
    simpleValue: PropTypes.bool,
    onChange: PropTypes.func,
  }

  static defaultProps = {
    patient: null,
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

  componentDidMount() {
    this.loadRelations();
  }

  componentWillReceiveProps(newProps) {
    if (newProps.patient !== this.props.patient) this.loadRelations(newProps);
  }

  async loadRelations(props = this.props) {
    const {  patient, relation, template, patientModel } = props;
    if (patient) {
      if (typeof patient === "string") {
        patientModel.set({ _id: patient });
        await patientModel.fetch();
      }

      let { [relation]: options } = patientModel.toJSON();
      options = options.map(item => ({ value: item._id, label: template(item) }) );
      this.setState({ options });
    }
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
  patientModel: new PatientModel(),
});

export default connect(null, mapDispatchToProps)(PatientRelationSelect);
