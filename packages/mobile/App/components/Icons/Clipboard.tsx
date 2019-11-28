import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

const Clipboard = React.memo((props: SvgProps) => {
  return (
    <Svg width="32" height="32" viewBox="0 0 32 32" fill="#326699" {...props}>
      <Path d="M25.8515 2.33806H23.6623C23.4197 2.33806 23.2229 2.53489 23.2229 2.7775C23.2229 3.02022 23.4197 3.21693 23.6623 3.21693H23.9339V27.4825H7.52832V3.21693H9.35731V4.21516C9.35731 4.98042 9.97972 5.60283 10.745 5.60283H12.8226C13.0303 6.74954 14.0362 7.62172 15.2414 7.62172H16.2205C17.4257 7.62172 18.4316 6.74954 18.6393 5.60283H20.7169C21.4823 5.60283 22.1049 4.9803 22.1049 4.21516V2.31869C22.1049 1.55344 21.4823 0.930908 20.717 0.930908H10.745C9.97972 0.930908 9.35731 1.55344 9.35731 2.31869V2.33806H5.61049C4.64406 2.33806 3.85791 3.12444 3.85791 4.09052V21.7315C3.85791 21.9743 4.05462 22.1709 4.29735 22.1709C4.53983 22.1709 4.73678 21.9743 4.73678 21.7315V4.09052C4.73678 3.60895 5.12903 3.21693 5.61049 3.21693H6.64922V27.9216C6.64922 28.1645 6.84616 28.3611 7.08865 28.3611H24.3733C24.6162 28.3611 24.8128 28.1645 24.8128 27.9216V3.21693H25.8515C26.3333 3.21693 26.7251 3.60895 26.7251 4.09052V29.1781C26.7251 29.66 26.3333 30.052 25.8515 30.052H5.61049C5.12903 30.052 4.73678 29.66 4.73678 29.1781V23.8029C4.73678 23.5604 4.53983 23.3634 4.29735 23.3634C4.05462 23.3634 3.85791 23.5604 3.85791 23.8029V29.1781C3.85791 30.1446 4.64406 30.9309 5.61049 30.9309H25.8515C26.8179 30.9309 27.604 30.1446 27.604 29.1781V4.09052C27.604 3.12444 26.8179 2.33806 25.8515 2.33806ZM10.2362 2.31869C10.2362 2.03806 10.4643 1.80989 10.745 1.80989H20.717C20.9976 1.80989 21.2258 2.03806 21.2258 2.31869V4.21516C21.2258 4.4958 20.9976 4.72396 20.717 4.72396H18.2396C17.9967 4.72396 17.8001 4.92079 17.8001 5.1634C17.8001 6.0344 17.0914 6.74285 16.2205 6.74285H15.2414C14.3706 6.74285 13.662 6.0344 13.662 5.1634C13.662 4.92079 13.4653 4.72396 13.2226 4.72396H10.745C10.4643 4.72396 10.2362 4.4958 10.2362 4.21516V2.31869Z" />
      <Path d="M21.3283 12.9553H19.0047L17.5195 8.89986C17.3721 8.4967 16.7873 8.52404 16.6811 8.94282L15.0859 15.2237L13.5459 10.7435C13.4228 10.3854 12.9327 10.3409 12.7471 10.6715L11.4659 12.9555H10.1328C9.88984 12.9555 9.69336 13.1521 9.69336 13.3949C9.69336 13.6375 9.88984 13.8344 10.1328 13.8344H11.7233C11.8823 13.8344 12.0288 13.7484 12.1067 13.6098L13.0336 11.9569L14.7336 16.9022C14.8751 17.314 15.4681 17.2897 15.5751 16.8676L17.1832 10.5368L18.285 13.5459C18.3482 13.719 18.513 13.8341 18.6977 13.8341H21.3282C21.571 13.8341 21.7676 13.6375 21.7676 13.3947C21.7676 13.1521 21.571 12.9553 21.3283 12.9553Z" />
      <Path d="M21.3283 20.2021H10.1328C9.89007 20.2021 9.69336 20.3988 9.69336 20.6416C9.69336 20.8843 9.89007 21.0811 10.1328 21.0811H21.3283C21.5711 21.0811 21.7678 20.8843 21.7678 20.6416C21.7678 20.3988 21.5711 20.2021 21.3283 20.2021Z" />
      <Path d="M21.3283 24.0739H10.1328C9.89007 24.0739 9.69336 24.2707 9.69336 24.5133C9.69336 24.756 9.89007 24.9528 10.1328 24.9528H21.3283C21.5711 24.9528 21.7678 24.756 21.7678 24.5133C21.7678 24.2707 21.5711 24.0739 21.3283 24.0739Z" />
    </Svg>
  );
});

export default Clipboard;
