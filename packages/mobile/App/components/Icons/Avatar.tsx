import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const Avatar = React.memo(() => {
  return (
    <Svg width="45" height="45" viewBox="0 0 45 45" fill="none">
      <Circle cx="22.5" cy="22.5" r="22.5" fill="#F76853" />
      <Path
        d="M17.8052 25.2021C17.8052 24.7871 17.6587 24.4697 17.3657 24.25C17.0728 24.0254 16.5454 23.791 15.7837 23.5469C15.022 23.2979 14.4189 23.0537 13.9746 22.8145C12.7637 22.1602 12.1582 21.2788 12.1582 20.1704C12.1582 19.5942 12.3193 19.0815 12.6416 18.6323C12.9688 18.1782 13.4351 17.8242 14.0405 17.5703C14.6509 17.3164 15.3345 17.1895 16.0913 17.1895C16.853 17.1895 17.5317 17.3286 18.1274 17.6069C18.7231 17.8804 19.1846 18.2686 19.5117 18.7715C19.8438 19.2744 20.0098 19.8457 20.0098 20.4854H17.8125C17.8125 19.9971 17.6587 19.6187 17.3511 19.3501C17.0435 19.0767 16.6113 18.9399 16.0547 18.9399C15.5176 18.9399 15.1001 19.0547 14.8022 19.2842C14.5044 19.5088 14.3555 19.8066 14.3555 20.1777C14.3555 20.5244 14.5288 20.8149 14.8755 21.0493C15.2271 21.2837 15.7422 21.5034 16.4209 21.7085C17.6709 22.0845 18.5815 22.5508 19.1528 23.1074C19.7241 23.6641 20.0098 24.3574 20.0098 25.1875C20.0098 26.1104 19.6606 26.8354 18.9624 27.3628C18.2642 27.8853 17.3242 28.1465 16.1426 28.1465C15.3223 28.1465 14.5752 27.9976 13.9014 27.6997C13.2275 27.397 12.7124 26.9844 12.356 26.4619C12.0044 25.9395 11.8286 25.334 11.8286 24.6455H14.0332C14.0332 25.8223 14.7363 26.4106 16.1426 26.4106C16.665 26.4106 17.0728 26.3057 17.3657 26.0957C17.6587 25.8809 17.8052 25.583 17.8052 25.2021ZM29.8096 24.9238L31.2451 17.3359H33.4351L31.0693 28H28.8574L27.1216 20.8662L25.3857 28H23.1738L20.8081 17.3359H22.998L24.4409 24.9092L26.1987 17.3359H28.0591L29.8096 24.9238Z"
        fill="white"
      />
    </Svg>
  );
});

export default Avatar;
