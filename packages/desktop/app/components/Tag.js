import styled from 'styled-components';

const DEFAULTS = {
  color: '#888888',
  background: '#F4F4F4',
};

export const Tag = styled.div`
  position: relative;
  background: ${p => (p.$background ? p.$background : DEFAULTS.background)};
  color: ${p => (p.$color ? p.$color : DEFAULTS.color)};
  padding: 3px 13px;
  border-radius: 20px;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
`;
