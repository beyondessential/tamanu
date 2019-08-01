import React from 'react';
import PropTypes from 'prop-types';

class RadioGroup extends React.Component {
  static propTypes = {
    label: PropTypes.any.isRequired,
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
    labelClass: PropTypes.string,
    inputClass: PropTypes.string,
    overwriteClass: PropTypes.bool,
    options: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
    stacked: PropTypes.bool,
  };

  static defaultProps = {
    required: false,
    className: 'field column',
    labelClass: 'label',
    inputClass: 'control',
    overwriteClass: false,
    stacked: true,
  };

  constructor(props) {
    super(props);
    this.state = { value: props.value ? props.value : '' };
    this.handleChange = this.handleChange.bind(this);
  }

  componentWillReceiveProps(newProps) {
    this.setState({ value: newProps.value ? newProps.value : '' });
  }

  handleChange = event => {
    const { name } = this.props;
    const { value } = event.target;
    if (this.props.onChange) this.props.onChange(value, name);
    this.setState({ value });
  };

  render() {
    const {
      label,
      required,
      name,
      overwriteClass,
      inputClass,
      labelClass,
      readOnly,
      options,
      stacked,
    } = this.props;
    const { value } = this.state;
    let { className } = this.props;
    if (!overwriteClass) className = `field ${className}`;

    return (
      <div className={className}>
        {label !== false && (
          <label className={labelClass}>
            {label} {required && <span className="isRequired">*</span>}
          </label>
        )}
        <div className={inputClass}>
          {options.map(option => {
            const { label: optionLabel, value: optionValue } = option;
            const isChecked = optionValue === value;
            const _className = `radio ${
              stacked ? 'is-block-inline m-r-15' : 'is-block'
            } m-b-5 m-l-0`;
            return (
              <label className={_className} key={optionValue}>
                <input
                  className="m-r-2"
                  type="radio"
                  name={name}
                  value={optionValue}
                  defaultChecked={isChecked}
                  // disabled={readOnly && !isChecked}
                  onChange={this.handleChange}
                />{' '}
                {optionLabel}
              </label>
            );
          })}
        </div>
      </div>
    );
  }
}

export default RadioGroup;
