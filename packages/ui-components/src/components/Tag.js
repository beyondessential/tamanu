import styled from 'styled-components';

const DEFAULTS = {
  color: '#888888',
  background: '#F4F4F4',
};

const BaseTag = styled.div`
  position: ${({ $position }) => $position || 'relative'};
  display: inline-block;
  background: ${({ $background, $color }) => {
    if ($background) {
      return $background;
    }
    if ($color) {
      // If no background-color prop was provided then use a semi-transparent version of the color
      return `${$color}1A`;
    }
    return DEFAULTS.background;
  }};
  color: ${(p) => (p.$color ? p.$color : DEFAULTS.color)};
  font-weight: 400;
  ${(p) => p.noWrap && 'white-space: nowrap;'}
`;

export const FormFieldTag = styled(BaseTag)`
  padding: 3px 13px;
  border-radius: 20px;
  font-size: 14px;
  line-height: 18px;
`;

export const TableCellTag = styled(BaseTag)`
  padding: 5px 10px;
  border-radius: 25px;
  font-size: 11px;
  line-height: 15px;
`;

// Keep Tag and StatusTag export temporarily for backwards compatibility until the
// labs epic is merged
export const Tag = FormFieldTag;
export const StatusTag = TableCellTag;
