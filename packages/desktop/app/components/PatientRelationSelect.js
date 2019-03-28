import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { PatientModel } from '../models';
import { SelectInput } from './Field';

export default class PatientRelationSelect extends Component {
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
      if (typeof patient === 'string') {
        this.patientModel.set({ _id: patient });
        await this.patientModel.fetch();
      }

      let { [relation]: options } = this.patientModel.toJSON();
      options = options.map(item => ({ value: item._id, label: template(item) }));
      this.setState({ options });
    }
  }

  render() {
    const {
      label,
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
