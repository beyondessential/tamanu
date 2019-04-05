import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { PatientModel } from '../models';
import { SelectInput } from './Field';

export default class PatientRelationSelect extends Component {
  static propTypes = {
    patient: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(PatientModel)]),
    relation: PropTypes.string.isRequired,
    template: PropTypes.func.isRequired,
    label: PropTypes.string.isRequired,
    required: PropTypes.bool,
    value: PropTypes.string,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func,
  }

  static defaultProps = {
    patient: null,
    required: false,
    onChange: () => {},
    value: '',
  }

  constructor(props) {
    super(props);
    this.patientModel = new PatientModel();
  }

  state = {
    options: [],
  }

  componentDidMount() {
    this.loadRelations();
  }

  componentWillReceiveProps(newProps) {
    if (newProps.patient !== this.props.patient) this.loadRelations(newProps);
  }

  handleChange = (value) => {
    const { onChange } = this.props;
    if (onChange) onChange(value);
    this.setState({ value });
  }

  async loadRelations(props = this.props) {
    const {
      patient, relation, template,
    } = props;
    if (patient) {
      let patientModel = patient;
      if (typeof patient === 'string') {
        this.patientModel.set({ _id: patient });
        await this.patientModel.fetch();
        patientModel = this.patientModel;
      }

      let { [relation]: options } = patientModel.toJSON();
      options = options.map(item => ({ value: item._id, label: template(item) }));
      this.setState({ options });
    }
  }

  render() {
    const {
      label,
      template,
      name,
      ...props
    } = this.props;
    const { options, value } = this.state;
    return (
      <SelectInput
        label={label}
        options={options}
        name={name}
        value={value}
        onChange={this.handleChange}
        {...props}
      />
    );
  }
}
