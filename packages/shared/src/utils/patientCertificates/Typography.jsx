import React from 'react';
import { Text } from '../pdf/Text';
import { useLanguageContext } from '../pdf/languageContext';

const baseStyles = {
  h1: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: 700,
  },
  h2: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 30,
    fontWeight: 700,
  },
  h3: {
    marginBottom: 20,
    fontSize: 14,
    fontWeight: 700,
  },
  p: {
    fontSize: 12,
    fontWeight: 400,
    marginBottom: 15,
  },
  certificateAddress: {
    textAlign: 'right',
    fontSize: 14,
    marginBottom: 13,
    fontWeight: 700,
  },
  certificateTitle: {
    fontSize: 18,
    textAlign: 'right',
    marginBottom: 14,
    fontWeight: 700,
  },
  certificateSubtitle: {
    fontWeight: 700,
    fontSize: 18,
    textAlign: 'right',
    marginTop: '-10px',
    height: 40,
  },
};

const useTypographyStyles = () => {
  const { pdfFont, pdfFontBold } = useLanguageContext();
  return React.useMemo(() => {
    return {
      h1: { ...baseStyles.h1, fontFamily: pdfFontBold },
      h2: { ...baseStyles.h2, fontFamily: pdfFontBold },
      h3: { ...baseStyles.h3, fontFamily: pdfFontBold },
      p: { ...baseStyles.p, fontFamily: pdfFont },
      certificateAddress: { ...baseStyles.certificateAddress, fontFamily: pdfFont },
      certificateTitle: { ...baseStyles.certificateTitle, fontFamily: pdfFont },
      certificateSubtitle: { ...baseStyles.certificateSubtitle, fontFamily: pdfFont },
    };
  }, [pdfFont, pdfFontBold]);
};

export const H1 = ({ style, ...props }) => {
  const styles = useTypographyStyles();
  return <Text style={{ ...styles.h1, ...style }} {...props} />;
};
export const H2 = ({ style, ...props }) => {
  const styles = useTypographyStyles();
  return <Text style={{ ...styles.h2, ...style }} {...props} />;
};
export const H3 = ({ style, ...props }) => {
  const styles = useTypographyStyles();
  return <Text style={{ ...styles.h3, ...style }} {...props} />;
};
export const P = ({ mt = 0, mb, bold = false, fontSize = 14, style = {}, ...props }) => {
  const styles = useTypographyStyles();
  return (
    <Text
      {...props}
      style={{
        ...styles.p,
        marginTop: mt,
        marginBottom: mb !== undefined ? mb : styles.p.marginBottom,
        fontSize,
        ...style,
      }}
      bold={bold}
    />
  );
};
export const CertificateAddress = props => {
  const styles = useTypographyStyles();
  return <Text style={styles.certificateAddress} {...props} />;
};
export const CertificateTitle = props => {
  const styles = useTypographyStyles();
  return <Text style={styles.certificateTitle} {...props} />;
};
export const CertificateSubtitle = props => {
  const styles = useTypographyStyles();
  return <Text style={styles.certificateSubtitle} {...props} />;
};
