import React, { memo, ReactElement } from 'react';
import { SvgXml, XmlProps } from 'react-native-svg';

export const ArrowDownIcon = memo((props: Omit<XmlProps, 'xml'>): ReactElement => {
  const xml = `
  <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M15.9998 25.1368C15.4998 25.1368 15.0208 24.9358 14.6678 24.5758L0.54975 10.2578C-0.18325 9.51175 -0.18325 8.30475 0.54975 7.55975C1.28475 6.81475 2.48075 6.81475 3.21175 7.55975L15.9998 20.5298L28.7847 7.55875C29.5208 6.81375 30.7148 6.81375 31.4487 7.55875C32.1828 8.30275 32.1828 9.51175 31.4487 10.2578L17.3318 24.5778C16.9768 24.9358 16.4977 25.1368 15.9998 25.1368Z" />
</svg>
  `;
  return <SvgXml xml={xml} {...props} />;
});
