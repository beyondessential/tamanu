import styled from 'styled-components';

export const CertificateWrapper = styled.div`
  position: relative;
  padding: 10px 20px;

  @media print {
    padding: 0;
  }

  &:before {
    content: '';
    background-size: contain;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    opacity: 0.05;
    background-image: ${props => (props.watermarkSrc ? `url("${props.watermarkSrc}")` : '')};
    background-position: center;
    background-repeat: no-repeat;
  }
`;
