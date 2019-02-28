import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Autocomplete from 'react-autocomplete';
import { map, capitalize, toUpper } from 'lodash';
import { DrugsCollection } from '../collections';
import { DrugModel } from '../models';

class DrugAutocomplete extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
    onChange: PropTypes.func.isRequired,
  }

  static defaultProps = {
    required: false,
    className: '',
  }

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    drugs: []
  }

  async componentWillMount() {
    const { value: _id } = this.props;
    if (_id) {
      const model = new DrugModel();
      model.set({ _id });
      await model.fetch();
      this.setState({ value: `${model.get('code')} - ${model.get('name')}` });
    }
  }

  async handleChange(event, value) {
    try {
      this.props.collection.setPageSize(1000);
      this.props.collection.setKeyword(value);
      await this.props.collection.getPage(0);
      let { models: drugs } = this.props.collection;
      if (drugs.length > 0) drugs = map(drugs, drug => drug.attributes);
      this.setState({ drugs, value });
    } catch (err) {
      console.error(err);
    }
  }

  render() {
    const {
      label,
      required,
      name,
      className,
    } = this.props;

    return (
      <div className={`column ${className}`}>
        <span className="input-group-title">
          {label} {required && <span className="isRequired">*</span>}
        </span>
        <Autocomplete
          inputProps={{ name: 'drug' }}
          getItemValue={(item) => `${item.code} - ${item.firstName} ${item.lastName}`}
          wrapperProps={{ className: 'autocomplete-wrapper' }}
          items={this.state.drugs}
          value={this.state.value}
          onSelect={(val, item) => {
            this.setState({ value: `${item.code} - ${item.name}` });
            if (this.props.onChange) this.props.onChange(item._id, name);
          }}
          onChange={this.handleChange}
          renderItem={(item, isHighlighted) =>
            <div key={item._id} style={{ background: isHighlighted ? 'lightgray' : 'white' }}> {`${item.code} - ${item.name}`} </div>
          }
          renderMenu={(items, val, style) => <div className="autocomplete-dropmenu" style={{ ...style, ...this.menuStyle }}>{items}</div>}
        />
      </div>
    );
  }
}

const mapDispatchToProps = () => ({
  collection: new DrugsCollection(),
});

export default connect(null, mapDispatchToProps)(DrugAutocomplete);
