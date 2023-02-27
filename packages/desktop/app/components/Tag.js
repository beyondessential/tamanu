import styled from 'styled-components';

const DEFAULTS = {
  color: '#888888',
  background: '#F4F4F4',
};

const BaseTag = styled.div`
  position: relative;
  display: inline-block;
  background: ${({ $background = DEFAULTS.background, $color = DEFAULTS.color }) => {
    if ($background) {
      return $background;
    }
    if ($color) {
      // If no background-color prop was provided then use a semi-transparent version of the color
      return `${$color}1A`;
    }
    return $background;
  }};
  color: ${({ $color = DEFAULTS.color }) => $color};
  font-weight: 400;
`;

// Used in form fields such as Autocomplete and Select
export const Tag = styled(BaseTag)`
  padding: 3px 13px;
  border-radius: 20px;
  font-size: 14px;
  line-height: 18px;
`;

// Used in tables
export const StatusTag = styled(BaseTag)`
  padding: 5px 10px;
  border-radius: 25px;
  font-size: 11px;
  line-height: 15px;
`;
