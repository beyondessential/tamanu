import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { StyledView } from '../../styled/common';
import { IconWithSizeProps } from '../../interfaces/WithSizeProps';

export const User = React.memo(({ size, ...rest }: IconWithSizeProps) => (
  <StyledView height={size} width={size}>
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 32 32"
      stroke-width="0.6"
      {...rest}
    >
      <Path d="M31 16C31 7.72927 24.2707 1 16 1C7.72927 1 1 7.72927 1 16C1 20.3685 2.87855 24.3062 5.86873 27.0498L5.85455 27.0624L6.34109 27.4725C6.37273 27.4993 6.40709 27.5211 6.43873 27.5473C6.69727 27.7616 6.96509 27.9651 7.23782 28.162C7.32618 28.2258 7.41455 28.2896 7.50455 28.3518C7.79582 28.5525 8.09473 28.7429 8.40018 28.9235C8.46673 28.9627 8.53382 29.0009 8.60091 29.0391C8.93527 29.2295 9.27673 29.4089 9.62636 29.5736C9.652 29.5856 9.67818 29.5965 9.70382 29.6085C10.8433 30.1382 12.0596 30.5271 13.3316 30.7567C13.3649 30.7627 13.3982 30.7687 13.432 30.7747C13.8269 30.8429 14.2262 30.8975 14.6304 30.934C14.6795 30.9384 14.7285 30.9411 14.7782 30.9455C15.1807 30.9787 15.5876 31 16 31C16.4085 31 16.8116 30.9787 17.212 30.9465C17.2627 30.9422 17.3135 30.9395 17.3642 30.9351C17.7651 30.8985 18.1611 30.8456 18.5522 30.7785C18.586 30.7725 18.6204 30.7665 18.6542 30.76C19.9071 30.5353 21.106 30.1551 22.2307 29.6391C22.2722 29.62 22.3142 29.602 22.3556 29.5824C22.6922 29.4242 23.0211 29.2535 23.3435 29.0718C23.4236 29.0265 23.5033 28.9807 23.5829 28.9338C23.8764 28.7609 24.1649 28.5804 24.4453 28.3884C24.5462 28.3196 24.6449 28.2471 24.7447 28.1751C24.9842 28.0027 25.2193 27.8249 25.4478 27.6389C25.4985 27.598 25.5531 27.5625 25.6027 27.5205L26.1018 27.1038L26.0871 27.0913C29.1035 24.3465 31 20.3909 31 16ZM2.09091 16C2.09091 8.33036 8.33036 2.09091 16 2.09091C23.6696 2.09091 29.9091 8.33036 29.9091 16C29.9091 20.1329 28.0955 23.8485 25.2242 26.398C25.0638 26.2873 24.9024 26.188 24.7371 26.1051L20.1187 23.7962C19.7042 23.5889 19.4467 23.1722 19.4467 22.7091V21.0962C19.5536 20.9642 19.6665 20.8147 19.7833 20.6505C20.3811 19.8062 20.8605 18.8669 21.2102 17.8562C21.9013 17.5278 22.3475 16.8395 22.3475 16.0622V14.1285C22.3475 13.6556 22.174 13.1969 21.8636 12.8364V10.2907C21.892 10.0076 21.9924 8.41 20.8365 7.09218C19.8313 5.94455 18.2042 5.36364 16 5.36364C13.7958 5.36364 12.1687 5.94455 11.1635 7.09164C10.0076 8.40945 10.108 10.0071 10.1364 10.2902V12.8358C9.82655 13.1964 9.65255 13.6551 9.65255 14.128V16.0616C9.65255 16.6622 9.922 17.2224 10.3835 17.6004C10.8253 19.3311 11.7345 20.6413 12.0705 21.0853V22.6638C12.0705 23.1089 11.8278 23.518 11.4367 23.7318L7.12382 26.0844C6.98636 26.1591 6.85 26.2464 6.71364 26.344C3.87782 23.7956 2.09091 20.1029 2.09091 16ZM24.1595 27.2538C23.9685 27.3924 23.7744 27.5265 23.5775 27.6547C23.4869 27.7136 23.3969 27.7725 23.3047 27.8298C23.0473 27.9891 22.7855 28.1407 22.5182 28.2825C22.4593 28.3136 22.3998 28.3431 22.3404 28.3736C21.7262 28.6884 21.0907 28.9589 20.4378 29.1787C20.4149 29.1864 20.392 29.1945 20.3685 29.2022C20.0265 29.3156 19.6802 29.4165 19.33 29.5033C19.3289 29.5033 19.3278 29.5038 19.3267 29.5038C18.9733 29.5911 18.6155 29.6636 18.2555 29.7231C18.2456 29.7247 18.2358 29.7269 18.226 29.7285C17.8873 29.7836 17.5458 29.8235 17.2033 29.8535C17.1427 29.8589 17.0822 29.8627 17.0211 29.8671C16.6824 29.8927 16.342 29.9091 16 29.9091C15.6542 29.9091 15.3095 29.8922 14.9664 29.8665C14.9069 29.8622 14.8475 29.8584 14.7885 29.8529C14.4427 29.8224 14.0985 29.7815 13.7576 29.7258C13.7424 29.7231 13.7271 29.7204 13.7118 29.7176C12.9907 29.5971 12.2811 29.4198 11.59 29.188C11.5687 29.1809 11.5469 29.1733 11.5256 29.1662C11.1825 29.0495 10.8433 28.9202 10.51 28.7773C10.5078 28.7762 10.5051 28.7751 10.5029 28.774C10.1876 28.6382 9.87836 28.4876 9.57291 28.3289C9.53309 28.3082 9.49273 28.2885 9.45345 28.2673C9.17473 28.1184 8.902 27.9575 8.63309 27.7895C8.55346 27.7393 8.47436 27.6885 8.39582 27.6373C8.14818 27.4753 7.90382 27.3067 7.666 27.1284C7.64145 27.1098 7.618 27.0902 7.59345 27.0716C7.61091 27.0618 7.62836 27.052 7.64582 27.0422L11.9587 24.6896C12.7005 24.2849 13.1615 23.5087 13.1615 22.6638L13.1609 20.6991L13.0355 20.5475C13.0235 20.5338 11.8442 19.0993 11.3985 17.1569L11.3489 16.9409L11.1629 16.8204C10.9005 16.6507 10.7435 16.3671 10.7435 16.0611V14.1275C10.7435 13.8738 10.8509 13.6376 11.0473 13.4604L11.2273 13.2978V10.2596L11.2224 10.1882C11.2207 10.1751 11.0598 8.86327 11.9838 7.81C12.7725 6.91109 14.1242 6.45455 16 6.45455C17.8687 6.45455 19.216 6.90727 20.0069 7.79964C20.9298 8.842 20.7787 10.1784 20.7776 10.1893L20.7727 13.2989L20.9527 13.4615C21.1485 13.6382 21.2565 13.8749 21.2565 14.1285V16.0622C21.2565 16.4511 20.992 16.804 20.6124 16.9213L20.3413 17.0047L20.254 17.2747C19.9322 18.2745 19.474 19.198 18.8925 20.0195C18.7496 20.2213 18.6105 20.4002 18.4911 20.5371L18.3558 20.6915V22.7091C18.3558 23.5884 18.8445 24.3793 19.6311 24.772L24.2495 27.0809C24.2789 27.0956 24.3078 27.1109 24.3367 27.1262C24.2784 27.1704 24.2184 27.2113 24.1595 27.2538Z" />
    </Svg>
  </StyledView>
));
