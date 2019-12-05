import React from 'react';
import Svg, { Path } from 'react-native-svg';

export const Notepad = React.memo(() => {
  return (
    <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <Path
        d="M26.4211 2.66669H22.6668V2.03069C22.6668 0.908938 21.7578 0 20.6361 0H11.3641C10.2424 0 9.33338 0.908938 9.33338 2.03069V2.66669H5.5785C3.97013 2.66669 2.6665 3.97031 2.6665 5.57869V29.088C2.6665 30.6964 3.97013 32 5.5785 32H26.4212C28.0296 32 29.3332 30.6964 29.3332 29.088V5.57869C29.3331 3.97031 28.0295 2.66669 26.4211 2.66669ZM12.0001 2.66669H19.9998V5.33337H12.0001V2.66669ZM26.6665 29.088C26.6665 29.2236 26.5568 29.3333 26.4212 29.3333H5.5785C5.44288 29.3333 5.33319 29.2236 5.33319 29.088V5.57869C5.33319 5.44306 5.44288 5.33337 5.5785 5.33337H9.33319V5.96938C9.33319 7.09106 10.2421 8.00006 11.3639 8.00006H11.3641H20.6359H20.6361C21.7578 8.00006 22.6668 7.09113 22.6668 5.96938V5.33331H26.4212C26.5568 5.33331 26.6665 5.443 26.6665 5.57863V29.088Z"
        fill="black"
      />
      <Path
        d="M15.609 16.3906L12.9423 13.7239C12.942 13.7237 12.9418 13.7235 12.9416 13.7233C12.9107 13.6925 12.8783 13.6633 12.8446 13.6356C12.8291 13.6229 12.8129 13.6119 12.797 13.6C12.7781 13.5858 12.7595 13.5712 12.7398 13.558C12.7208 13.5453 12.7011 13.5343 12.6817 13.5227C12.6638 13.512 12.6464 13.5008 12.628 13.4909C12.6081 13.4803 12.5878 13.4713 12.5675 13.4618C12.5483 13.4527 12.5294 13.4431 12.5097 13.4349C12.4901 13.4268 12.47 13.4202 12.4501 13.4131C12.429 13.4055 12.4081 13.3974 12.3865 13.3908C12.3666 13.3848 12.3464 13.3804 12.3263 13.3753C12.3042 13.3698 12.2825 13.3636 12.26 13.3592C12.2367 13.3545 12.2132 13.3518 12.1898 13.3485C12.1702 13.3457 12.151 13.3419 12.131 13.34C12.0435 13.3313 11.9554 13.3313 11.8679 13.34C11.848 13.3419 11.8287 13.3457 11.8091 13.3485C11.7856 13.3518 11.7622 13.3545 11.739 13.3592C11.7165 13.3636 11.6947 13.3698 11.6726 13.3753C11.6525 13.3804 11.6323 13.3848 11.6125 13.3908C11.5908 13.3974 11.57 13.4055 11.5488 13.4131C11.529 13.4202 11.5089 13.4268 11.4893 13.4349C11.4695 13.4431 11.4506 13.4527 11.4314 13.4618C11.4112 13.4713 11.3908 13.4803 11.371 13.4908C11.3526 13.5007 11.3351 13.512 11.3172 13.5227C11.2978 13.5343 11.2781 13.5452 11.2591 13.5579C11.2394 13.5711 11.2208 13.5858 11.2018 13.6C11.186 13.6119 11.1698 13.6228 11.1544 13.6355C11.1204 13.6634 11.0877 13.6928 11.0567 13.7238L8.39003 16.3905C7.86934 16.9112 7.86934 17.7555 8.39003 18.2762C8.91071 18.7968 9.75496 18.7968 10.2757 18.2762L10.6662 17.8857V24.0001C10.6662 24.7365 11.2631 25.3334 11.9995 25.3334C12.7358 25.3334 13.3328 24.7365 13.3328 24.0001V17.8857L13.7233 18.2762C14.244 18.7969 15.0882 18.7969 15.6089 18.2762C16.1296 17.7555 16.1296 16.9113 15.609 16.3906Z"
        fill="black"
      />
      <Path
        d="M21.7233 20.3904L21.3328 20.7809V14.6666C21.3328 13.9302 20.7358 13.3333 19.9995 13.3333C19.2631 13.3333 18.6662 13.9302 18.6662 14.6666V20.7809L18.2757 20.3904C17.755 19.8697 16.9107 19.8697 16.39 20.3904C15.8693 20.9111 15.8693 21.7554 16.39 22.2761L19.0567 24.9427C19.057 24.943 19.0572 24.9431 19.0574 24.9434C19.0883 24.9742 19.1207 25.0034 19.1544 25.031C19.1698 25.0437 19.1861 25.0547 19.202 25.0666C19.2209 25.0808 19.2395 25.0955 19.2592 25.1087C19.2782 25.1214 19.2978 25.1324 19.3173 25.144C19.3352 25.1547 19.3526 25.1659 19.371 25.1757C19.3908 25.1864 19.4112 25.1953 19.4315 25.2049C19.4507 25.2139 19.4696 25.2236 19.4893 25.2317C19.5089 25.2399 19.529 25.2464 19.5488 25.2536C19.57 25.2612 19.5908 25.2692 19.6125 25.2758C19.6323 25.2818 19.6526 25.2862 19.6727 25.2913C19.6948 25.2969 19.7165 25.3031 19.739 25.3075C19.7623 25.3121 19.7858 25.3148 19.8092 25.3182C19.8288 25.321 19.848 25.3247 19.868 25.3267C19.9113 25.3309 19.9547 25.3332 19.9982 25.3332C19.9986 25.3332 19.9991 25.3333 19.9995 25.3333C20 25.3333 20.0005 25.3332 20.0009 25.3332C20.0443 25.3332 20.0878 25.3309 20.1311 25.3267C20.151 25.3247 20.1703 25.321 20.1899 25.3182C20.2133 25.3148 20.2368 25.3121 20.26 25.3075C20.2825 25.3031 20.3043 25.2969 20.3263 25.2913C20.3465 25.2862 20.3667 25.2818 20.3866 25.2758C20.4082 25.2692 20.4291 25.2612 20.4502 25.2536C20.4701 25.2464 20.4902 25.2399 20.5098 25.2317C20.5295 25.2236 20.5484 25.214 20.5676 25.2049C20.5878 25.1953 20.6082 25.1864 20.628 25.1757C20.6464 25.1659 20.6639 25.1547 20.6818 25.144C20.7012 25.1324 20.7209 25.1214 20.7399 25.1087C20.7596 25.0955 20.7782 25.0808 20.7971 25.0666C20.813 25.0547 20.8292 25.0437 20.8447 25.031C20.8784 25.0034 20.9108 24.9742 20.9417 24.9434C20.9419 24.9431 20.9422 24.943 20.9423 24.9427L23.609 22.2761C24.1297 21.7554 24.1297 20.9111 23.609 20.3904C23.0882 19.8697 22.244 19.8697 21.7233 20.3904Z"
        fill="black"
      />
    </Svg>
  );
});
