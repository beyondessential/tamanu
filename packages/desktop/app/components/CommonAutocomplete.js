import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Autocomplete from 'react-autocomplete';

export class CommonAutocomplete extends Component {
  static propTypes = {
    collection: PropTypes.object.isRequired,
    ModelClass: PropTypes.func.isRequired,
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
    options: []
  }

  async componentWillMount() {
    const { value: _id, formatOptionLabel } = this.props;
    if (_id) {
      const model = new ModelClass();
      model.set({ _id });
      await model.fetch();
      this.setState({ selectedOption: formatOptionLabel(model.attributes) });
    }
  }

  async handleChange(event, value) {
    const { collection } = this.props;
    try {
      collection.setPageSize(1000);
      collection.setKeyword(value);
      await collection.getPage(0);
      const { models = [] } = collection;
      const options = models.map(model => model.attributes);
      this.setState({ options, selectedOption: value });
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
      formatOptionLabel,
      onChange,
    } = this.props;

    return (
      <div className={`column ${className}`}>
        <span className="input-group-title">
          {label} {required && <span className="isRequired">*</span>}
        </span>
        <Autocomplete
          inputProps={{ name }}
          getItemValue={formatOptionLabel}
          wrapperProps={{ className: 'autocomplete-wrapper' }}
          items={this.state.options}
          value={this.state.selectedOption}
          onSelect={(val, item) => {
            this.setState({ selectedOption: val });
            if (onChange) onChange(item._id, name);
          }}
          onChange={this.handleChange}
          renderItem={(item, isHighlighted) =>
            <div key={item._id} style={{ background: isHighlighted ? 'lightgray' : 'white' }}> {formatOptionLabel(item)} </div>
          }
          renderMenu={(items, val, style) => <div className="autocomplete-dropmenu" style={{ ...style, ...this.menuStyle }}>{items}</div>}
        />
      </div>
    );
  }
}
