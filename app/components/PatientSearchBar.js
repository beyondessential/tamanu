import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

class PatientSearchBar extends Component {
  static propTypes = {
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
    overwriteClass: PropTypes.bool,
    autoFocus: PropTypes.bool,
    placeholder: PropTypes.string,
    onSubmit: PropTypes.func,
    onReset: PropTypes.func,
  }

  static defaultProps = {
    required: false,
    className: 'field column',
    overwriteClass: false,
    autoFocus: false,
    placeholder: 'Search patients',
    onSubmit: () => {},
    onReset: () => {},
  }

  constructor(props) {
    super(props);
    this.state = { value: (props.value ? props.value : '') };
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentWillReceiveProps(newProps) {
    this.setState({ value: (newProps.value ? newProps.value : '') });
  }

  handleChange(e) {
    if (e.target.value === '') this.props.onReset();
    this.setState({ value: e.target.value });
  }

  onSubmit(e){
    e.preventDefault()
    const { value } = this.state;
    console.log({value});
    if (value === '') return this.props.onReset();
    this.props.onSubmit(value, e);
  }

  render() {
    const {
      required,
      name,
      tabIndex,
      overwriteClass,
      readOnly,
      autoFocus,
      placeholder,
    } = this.props;
    let { className } = this.props;
    if (!overwriteClass) className = `field has-addons ${className}`;

    return (
      <form onSubmit={this.onSubmit}>
        <div className={className}>
          <div className="control">
            <input
              className="input"
              type="search"
              name={name}
              placeholder={placeholder}
              tabIndex={tabIndex}
              value={this.state.value}
              onChange={this.handleChange.bind(this)}
              required={required}
              readOnly={readOnly}
              autoFocus={autoFocus}
            />
          </div>
          <div className="control">
            <button className="button is-info" type="button">
              <i className="fa fa-search" />
            </button>
          </div>
        </div>
      </form>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentPath: state.router.location.pathname
  };
}

export default connect(mapStateToProps, {})(PatientSearchBar);
