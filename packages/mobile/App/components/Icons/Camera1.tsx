import React from 'react';
import Svg, { G, Path, Defs, Rect, ClipPath, SvgProps } from 'react-native-svg';

export const Camera1 = React.memo((props: SvgProps) => (
  <Svg width="32" height="32" viewBox="0 0 32 32" fill="none" {...props}>
    <G clip-path="url(#clip0)">
      <Path d="M30.9354 7.33069C30.2966 6.66149 29.4145 6.26605 28.4106 6.26605H23.3612V6.20522C23.3612 5.44476 23.057 4.71472 22.5399 4.22803C22.0228 3.71092 21.3232 3.40674 20.5627 3.40674H11.4373C10.6464 3.40674 9.94677 3.71092 9.42966 4.22803C8.91255 4.74514 8.60837 5.44476 8.60837 6.20522V6.26605H3.58935C2.58555 6.26605 1.70342 6.66149 1.06464 7.33069C0.425856 7.96948 0 8.88202 0 9.85541V25.0037C0 26.0075 0.395437 26.8896 1.06464 27.5284C1.70342 28.1672 2.61597 28.5931 3.58935 28.5931H28.4106C29.4145 28.5931 30.2966 28.1976 30.9354 27.5284C31.5741 26.8896 32 25.9771 32 25.0037V9.85541C32 8.85161 31.6046 7.96948 30.9354 7.33069ZM30.4183 25.0037H30.3878C30.3878 25.5512 30.1749 26.0379 29.8099 26.4029C29.4449 26.768 28.9582 26.9809 28.4106 26.9809H3.58935C3.04183 26.9809 2.55513 26.768 2.19011 26.4029C1.8251 26.0379 1.61217 25.5512 1.61217 25.0037V9.85541C1.61217 9.30788 1.8251 8.82119 2.19011 8.45617C2.55513 8.09115 3.04183 7.87822 3.58935 7.87822H9.46008C9.91635 7.87822 10.2814 7.5132 10.2814 7.05693V6.1748C10.2814 5.8402 10.403 5.53602 10.616 5.32309C10.8289 5.11016 11.1331 4.98849 11.4677 4.98849H20.5627C20.8973 4.98849 21.2015 5.11016 21.4144 5.32309C21.6274 5.53602 21.7491 5.8402 21.7491 6.1748V7.05693C21.7491 7.5132 22.1141 7.87822 22.5703 7.87822H28.4411C28.9886 7.87822 29.4753 8.09115 29.8403 8.45617C30.2053 8.82119 30.4183 9.30788 30.4183 9.85541V25.0037Z" />
      <Path d="M16 9.94678C13.9315 9.94678 12.0456 10.7985 10.7072 12.1369C9.33838 13.5057 8.51709 15.3612 8.51709 17.4297C8.51709 19.4981 9.3688 21.3841 10.7072 22.7225C12.076 24.0913 13.9315 24.9126 16 24.9126C18.0684 24.9126 19.9544 24.0609 21.2928 22.7225C22.6616 21.3536 23.4829 19.4981 23.4829 17.4297C23.4829 15.3612 22.6312 13.4753 21.2928 12.1369C19.9544 10.7985 18.0684 9.94678 16 9.94678ZM20.1369 21.597C19.0722 22.6312 17.6122 23.3004 16 23.3004C14.3878 23.3004 12.9277 22.6312 11.8631 21.597C10.7985 20.5323 10.1597 19.0723 10.1597 17.4601C10.1597 15.8479 10.8289 14.3878 11.8631 13.3232C12.9277 12.2586 14.3878 11.6198 16 11.6198C17.6122 11.6198 19.0722 12.289 20.1369 13.3232C21.2015 14.3878 21.8403 15.8479 21.8403 17.4601C21.8707 19.0723 21.2015 20.5323 20.1369 21.597Z" />
      <Path d="M26.8289 12.8972C27.652 12.8972 28.3194 12.2299 28.3194 11.4068C28.3194 10.5836 27.652 9.91626 26.8289 9.91626C26.0057 9.91626 25.3384 10.5836 25.3384 11.4068C25.3384 12.2299 26.0057 12.8972 26.8289 12.8972Z" />
    </G>
    <Defs>
      <ClipPath id="clip0">
        <Rect width="32" height="32" fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
));
