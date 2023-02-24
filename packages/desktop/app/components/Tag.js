import styled from 'styled-components';

const DEFAULTS = {
  color: '#888888',
  background: '#F4F4F4',
};

const BaseTag = styled.div`
  position: relative;
  display: inline-block;
  background: ${({ $background, $color }) => {
    if ($background) {
      return $background;
    }
    if ($color) {
      return `${$color}1A`;
    }
    return DEFAULTS.background;
  }};
  color: ${p => (p.$color ? p.$color : DEFAULTS.color)};
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

// Used in Tiles
export const TileTag = styled(StatusTag)`
  margin-left: -2px;
  margin-right: -2px;
`;

// Not sure where this lives
export const STATUS_TAG_COLORS = {
  ORANGE: '#CB6100',
  GREEN: '#19934E',
  PURPLE: '#4101C9',
  BLUE: '#1172D1',
  PINK: '#D10580',
  YELLOW: '#BD9503',
  GREY: '#444444',
};
