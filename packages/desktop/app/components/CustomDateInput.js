import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const DateInput = styled.div`
  background: rgba(219, 235, 255, 0.2);
  border: 1px solid #dee2e7;
  display: block;
  padding: 6px;
  width: 100%;
  font-size: 16px;
  color: #555;
  background-color: $main-white-color;
  background-image: none;
  border-radius: 3px;
  -webkit-transition: border-color ease-in-out .15s, box-shadow ease-in-out .15s;
  transition: border-color ease-in-out .15s, box-shadow ease-in-out .15s;
  text-align: left;
`;
class CustomDateInput extends Component {
  render() {
    const { onClick, value } = this.props;
    return (
      <DateInput onClick={onClick}>
        {value}
      </DateInput>
    );
  }
}

CustomDateInput.propTypes = {
  onClick: PropTypes.func,
};

CustomDateInput.defaultProps = {
  onClick: () => {}
};

export default CustomDateInput;
