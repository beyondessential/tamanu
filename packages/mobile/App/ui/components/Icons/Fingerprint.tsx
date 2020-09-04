import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';

export const FingerprintIcon = memo(props => {
  const xml = `
  <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g clipPath="url(#clip0)">
    <ellipse cx="24" cy="25" rx="17" ry="24" fill="white" />
    <path d="M28.95 24.6191C28.0318 21.8951 25.0792 20.4312 22.3552 21.3494C19.8022 22.21 18.3278 24.8766 18.9566 27.4964C20.8304 34.0108 27.6841 39.8569 33.9612 44.8244C34.412 45.1814 35.0667 45.1055 35.4238 44.6547C35.7808 44.2039 35.7049 43.5492 35.2541 43.1921C29.2289 38.4245 22.6604 32.8427 20.9573 26.9217C20.4807 25.263 21.439 23.5321 23.0976 23.0555C24.7563 22.5789 26.4872 23.5371 26.9638 25.1958C28.1005 29.1514 33.753 34.0399 39.1307 38.2953C39.5815 38.6523 40.2362 38.5764 40.5933 38.1256C40.9503 37.6749 40.8744 37.0201 40.4236 36.663C37.5839 34.4209 30.0639 28.4706 28.95 24.6191Z" fill="#326699" />
    <path d="M36.8407 21.9355C34.5776 14.9967 27.2453 11.0772 20.2185 13.0497C13.0345 15.111 8.88182 22.6059 10.9432 29.7899C10.9447 29.795 10.9462 29.8001 10.9476 29.8052C12.6569 35.743 8.99268 37.3897 7.82471 37.752C7.27625 37.9244 6.97147 38.5089 7.14392 39.0574C7.31636 39.6058 7.90083 39.9106 8.4493 39.7381C11.6326 38.743 14.7243 35.3952 12.9484 29.2284C11.1976 23.1515 14.7046 16.8061 20.7814 15.0553C20.7846 15.0544 20.7879 15.0534 20.791 15.0525C26.7995 13.3636 33.0598 16.7689 34.9066 22.7307C34.9312 22.8119 34.9662 22.8896 35.0107 22.9618C35.1189 23.1409 35.3417 23.5177 42.0331 28.9474C42.4792 29.3101 43.135 29.2426 43.4977 28.7964C43.8605 28.3503 43.7929 27.6945 43.3468 27.3318C40.9151 25.3582 37.3612 22.4247 36.8407 21.9355Z" fill="#326699" />
    <path d="M32.9555 23.4677C31.5176 18.5028 26.3358 15.635 21.3652 17.0533C16.4846 18.5601 13.6518 23.6387 14.9341 28.5831C17.0369 38.16 15.465 40.371 11.1511 41.7201C10.6027 41.8926 10.2979 42.4771 10.4703 43.0255C10.6428 43.574 11.2272 43.8788 11.7757 43.7063C17.8029 41.8326 19.1125 37.8935 16.9805 28.1354C15.9448 24.2661 18.1346 20.2663 21.9522 19.054C25.8206 17.9558 29.8495 20.1884 30.9692 24.0507C31.3856 25.4705 32.4911 27.4192 41.0167 34.1669C41.4675 34.5239 42.1222 34.4479 42.4793 33.9972C42.8363 33.5464 42.7603 32.8916 42.3096 32.5346C34.571 26.4137 33.2469 24.4755 32.9555 23.4677Z" fill="#326699" />
    <path d="M35.8203 37.958C32.2976 35.2848 26.4016 30.8128 24.9505 25.7704C24.7822 25.2206 24.2001 24.9114 23.6504 25.0797C23.1141 25.2439 22.8042 25.8033 22.9496 26.345C24.5903 32.0537 30.8319 36.788 34.5607 39.6174C35.3185 40.163 36.0481 40.7467 36.7467 41.3662C37.1602 41.7657 37.8193 41.7542 38.2187 41.3408C38.6084 40.9373 38.6084 40.2977 38.2187 39.8944C37.4563 39.2043 36.6556 38.5578 35.8203 37.958Z" fill="#326699" />
    <path d="M30.1864 45.1992C29.1343 43.2472 27.1963 41.9309 24.9941 41.6723C21.4547 41.6723 20.9073 47.6891 20.8302 48.8946C20.7945 49.4683 21.2308 49.9623 21.8045 49.998H21.8712C22.4218 49.9991 22.878 49.5712 22.9122 49.0216C23.0433 46.8773 23.8636 43.7543 24.9941 43.7543C26.5368 43.7543 27.6319 45.2408 28.5105 46.4338C28.8007 46.8476 29.1186 47.2413 29.4619 47.6122C29.8754 48.0117 30.5344 48.0001 30.9339 47.5866C31.3236 47.1832 31.3236 46.5437 30.9339 46.1402C30.6646 45.8431 30.4149 45.5287 30.1864 45.1992Z" fill="#326699" />
    <path d="M20.7825 36.151C20.5869 35.6104 19.99 35.3308 19.4494 35.5265C18.941 35.7105 18.6581 36.2533 18.7985 36.7756C19.6896 39.5592 17.9386 45.0221 15.305 45.8778C14.7564 46.0496 14.4508 46.6335 14.6225 47.1822C14.7942 47.7309 15.3782 48.0364 15.9269 47.8648C15.9341 47.8625 15.9412 47.8602 15.9484 47.8577C19.9539 46.567 21.8859 39.6091 20.7825 36.151Z" fill="#326699" />
    <path d="M43.0128 21.9438C41.7116 21.5274 40.6893 19.8619 39.5047 17.961C36.998 13.9095 33.5607 8.36115 23.9546 8.36115C14.1858 8.37266 6.26947 16.289 6.25806 26.0578C6.25806 26.6327 6.72415 27.0988 7.29906 27.0988C7.87397 27.0988 8.34007 26.6327 8.34007 26.0578C8.34924 17.4378 15.3347 10.4523 23.9547 10.4432C32.4011 10.4432 35.3596 15.2192 37.7372 19.0582C39.1363 21.3172 40.3437 23.2679 42.3716 23.9258C42.9164 24.1093 43.5069 23.8165 43.6904 23.2717C43.874 22.7269 43.5811 22.1364 43.0364 21.9529C43.0293 21.9504 43.0221 21.9482 43.0149 21.9458L43.0128 21.9438Z" fill="#326699" />
    <path d="M8.3386 34.3854C8.91351 34.3854 9.37961 33.9193 9.37951 33.3444C9.37951 33.1825 9.34174 33.0229 9.26923 32.8781C8.825 32.0454 8.51105 31.1495 8.3386 30.2216C8.3386 29.6467 7.87251 29.1806 7.2976 29.1806C6.72269 29.1806 6.25659 29.6467 6.25659 30.2216C6.42367 31.477 6.81364 32.6925 7.40787 33.8109C7.58452 34.163 7.94472 34.3854 8.3386 34.3854Z" fill="#326699" />
    <path d="M7.79737 12.3731C8.28826 12.6723 8.92885 12.517 9.22806 12.0261C9.22865 12.0252 9.22923 12.0243 9.22972 12.0233C10.1333 10.5326 14.5845 6.27918 22.9123 6.27918C30.9153 6.27918 36.6094 10.3327 37.6358 12.0233C37.9341 12.5149 38.5745 12.6714 39.0661 12.3731C39.5577 12.0747 39.7142 11.4343 39.4159 10.9428C37.9876 8.59014 31.6815 4.19727 22.9123 4.19727C13.5873 4.19727 8.58854 9.06697 7.44761 10.9448C7.15044 11.4359 7.30698 12.0748 7.79737 12.3731Z" fill="#326699" />
    <path d="M13.9598 4.10562C14.4365 3.89745 14.8405 3.68919 15.2235 3.48103C16.7892 2.69201 17.9155 2.11524 22.9121 2.11524C26.286 1.92933 29.6605 2.4696 32.8076 3.69964C33.2053 3.84749 33.605 3.99524 34.0235 4.13889C34.1326 4.17676 34.2473 4.19647 34.3628 4.19716C34.9377 4.19823 35.4046 3.73301 35.4057 3.1581C35.4065 2.7125 35.1236 2.31589 34.7021 2.17145C34.2982 2.032 33.9152 1.89039 33.5321 1.75503C30.1536 0.437453 26.534 -0.149363 22.9122 0.0333274C17.4076 0.0333274 16.0293 0.741157 14.2805 1.63851C13.9287 1.81964 13.5539 2.01121 13.1167 2.20688C12.5825 2.41924 12.3215 3.0245 12.5338 3.55871C12.7462 4.09293 13.3514 4.35389 13.8856 4.14163C13.913 4.13079 13.9398 4.11879 13.9661 4.10562H13.9598Z" fill="#326699" />
    <path d="M41.6975 18.0463C41.8932 18.5869 42.4901 18.8665 43.0306 18.6708C43.5391 18.4868 43.822 17.944 43.6816 17.4218C43.0909 15.8924 42.3583 14.4216 41.4935 13.0289C41.1922 12.5391 40.5509 12.3861 40.0611 12.6874C39.5713 12.9887 39.4184 13.6299 39.7196 14.1198C40.4946 15.3672 41.1566 16.6812 41.6975 18.0463Z" fill="#326699" />
    <path d="M34.5999 45.0492C34.3656 45.049 34.1382 44.9697 33.9545 44.8243C27.6775 39.8547 20.83 34.0107 18.9562 27.4963C18.2853 24.7011 20.0074 21.8914 22.8026 21.2204C25.4224 20.5916 28.089 22.066 28.9496 24.619C30.0571 28.4685 37.5771 34.4208 40.4003 36.661C40.862 37.0036 40.9585 37.6557 40.6158 38.1173C40.2732 38.5789 39.6212 38.6755 39.1596 38.3328C39.1425 38.3202 39.1257 38.3069 39.1094 38.2932C33.7317 34.0378 28.0751 29.1514 26.9405 25.1937C26.4638 23.5356 24.7333 22.5778 23.0754 23.0545C21.4173 23.5311 20.4595 25.2616 20.9362 26.9196C22.6392 32.8406 29.2077 38.4223 35.2308 43.19C35.6816 43.5468 35.7576 44.2016 35.4007 44.6523C35.203 44.902 34.9019 45.0474 34.5833 45.047L34.5999 45.0492Z" fill="#326699" />
    <path d="M8.12988 39.7797C7.55497 39.7787 7.08975 39.3118 7.09082 38.7369C7.0916 38.2829 7.38662 37.8818 7.81973 37.7456C8.98351 37.3813 12.6478 35.7345 10.9427 29.7989C8.87664 22.6163 13.0245 15.1187 20.2071 13.0527C20.2106 13.0517 20.2142 13.0507 20.2177 13.0497C27.2453 11.0758 34.5789 14.9957 36.8421 21.9355C37.3605 22.4226 40.9144 25.3582 43.3461 27.3319C43.7811 27.7076 43.8292 28.365 43.4535 28.8001C43.0938 29.2167 42.472 29.2812 42.0344 28.9475C35.3409 23.5157 35.1182 23.1389 35.0099 22.9598C34.9669 22.8878 34.9326 22.8109 34.9079 22.7307C33.0611 16.7678 26.7995 13.3623 20.7903 15.0526C14.7121 16.799 11.2006 23.142 12.947 29.2201C12.9472 29.2208 12.9474 29.2215 12.9476 29.2222C14.7214 35.3869 11.6317 38.7367 8.44636 39.7319C8.34399 39.7642 8.23723 39.7804 8.12988 39.7797Z" fill="#326699" />
    <path d="M11.4614 43.7541C10.8865 43.7531 10.4213 43.2862 10.4224 42.7113C10.4231 42.2573 10.7182 41.8562 11.1513 41.7201C15.4651 40.371 17.0349 38.1557 14.9321 28.583C13.6509 23.6387 16.4833 18.5609 21.3632 17.0532C26.3339 15.6385 31.5138 18.5047 32.9555 23.4677C33.2449 24.4732 34.5669 26.4115 42.293 32.5283C42.7547 32.871 42.8513 33.523 42.5086 33.9846C42.166 34.4463 41.514 34.5428 41.0524 34.2002C41.0353 34.1875 41.0185 34.1742 41.0022 34.1605C32.4662 27.4108 31.3607 25.4601 30.9547 24.0443C29.839 20.178 25.8053 17.9432 21.9357 19.0476C18.1137 20.2609 15.9238 24.2674 16.9661 28.1395C19.1084 37.8997 17.7988 41.8284 11.7612 43.7104C11.664 43.7398 11.563 43.7545 11.4614 43.7541Z" fill="#326699" />
    <path d="M37.4857 41.6722C37.2094 41.6727 36.9443 41.5634 36.7487 41.3682C36.0498 40.7482 35.3202 40.1638 34.5626 39.6173C30.8339 36.788 24.5922 32.0536 22.9516 26.3449C22.7834 25.7952 23.0925 25.2132 23.6423 25.0448C24.192 24.8766 24.774 25.1857 24.9424 25.7355C24.9459 25.747 24.9492 25.7586 24.9523 25.7702C26.4097 30.8126 32.2974 35.2847 35.8201 37.9579C36.6559 38.5587 37.4573 39.2057 38.2205 39.8961C38.6264 40.3033 38.6255 40.9624 38.2182 41.3683C38.0237 41.5624 37.7604 41.6716 37.4857 41.6722Z" fill="#326699" />
    <path d="M21.8712 50.0001H21.8045C21.2308 49.9643 20.7945 49.4703 20.8302 48.8966C20.9051 47.6911 21.4547 41.6743 24.9941 41.6743C27.2009 41.9309 29.1438 43.2481 30.1989 45.2032C30.426 45.5333 30.675 45.8476 30.9442 46.1443C31.3437 46.5578 31.3321 47.2168 30.9187 47.6163C30.5152 48.006 29.8757 48.006 29.4723 47.6163C29.1282 47.2467 28.8104 46.8536 28.5208 46.44C27.6339 45.2408 26.5389 43.7543 24.994 43.7543C23.8655 43.7543 23.0432 46.8772 22.9121 49.0238C22.878 49.5732 22.4218 50.0011 21.8712 50.0001Z" fill="#326699" />
    <path d="M15.6252 47.918C15.0503 47.9191 14.5834 47.454 14.5823 46.8791C14.5814 46.4262 14.8735 46.0247 15.3046 45.8861C17.9362 45.0304 19.6767 39.5674 18.7981 36.7839C18.5923 36.247 18.8607 35.6451 19.3974 35.4393C19.9342 35.2334 20.5362 35.5018 20.742 36.0386C20.7572 36.078 20.7699 36.1183 20.7801 36.1593C21.8856 39.6174 19.9474 46.569 15.9458 47.8765C15.8418 47.9069 15.7337 47.921 15.6252 47.918Z" fill="#326699" />
    <path d="M7.29784 27.0986C6.72293 27.0986 6.25684 26.6325 6.25684 26.0576C6.26835 16.2888 14.1846 8.3725 23.9533 8.36108C33.5594 8.36108 36.9967 13.9094 39.5055 17.961C40.6901 19.8701 41.7123 21.5211 43.0136 21.9438C43.5623 22.1155 43.8678 22.6995 43.6962 23.2482C43.5245 23.7968 42.9404 24.1024 42.3917 23.9307C42.3845 23.9285 42.3774 23.9261 42.3703 23.9237C40.3424 23.2658 39.1349 21.315 37.7359 19.0561C35.3582 15.2191 32.3999 10.4431 23.9533 10.4431C15.3334 10.4523 8.34792 17.4378 8.33875 26.0577C8.33875 26.6325 7.87275 27.0986 7.29784 27.0986Z" fill="#326699" />
    <path d="M8.33875 34.3855C7.94409 34.3863 7.58291 34.1638 7.40607 33.8109C6.81203 32.6926 6.42284 31.477 6.25684 30.2216C6.25684 29.6466 6.72293 29.1805 7.29784 29.1805C7.87275 29.1805 8.33885 29.6466 8.33885 30.2216C8.51178 31.1494 8.82563 32.0453 9.26948 32.8781C9.52702 33.3921 9.31915 34.0176 8.80514 34.2751C8.66031 34.3477 8.50065 34.3855 8.33875 34.3855Z" fill="#326699" />
    <path d="M38.5266 12.5249C38.1622 12.5251 37.8242 12.3348 37.6355 12.0232C36.6112 10.3326 30.915 6.27906 22.912 6.27906C14.5843 6.27906 10.133 10.5325 9.22737 12.0232C8.9469 12.525 8.31265 12.7045 7.81084 12.4239C7.30902 12.1434 7.12955 11.5092 7.41013 11.0074C7.42242 10.9853 7.4356 10.9637 7.44946 10.9427C8.58825 9.06685 13.5871 4.19714 22.9121 4.19714C31.6813 4.19714 37.9875 8.59002 39.4157 10.9447C39.7135 11.4365 39.5562 12.0766 39.0644 12.3743C38.9021 12.4726 38.7162 12.5247 38.5266 12.5249Z" fill="#326699" />
    <path d="M34.3627 4.19686C34.2472 4.19706 34.1326 4.17813 34.0234 4.14065C33.6069 3.997 33.2031 3.8471 32.8054 3.70139C29.659 2.47116 26.2853 1.93011 22.912 2.11495C17.9153 2.11495 16.789 2.69162 15.2338 3.48903C14.8508 3.68685 14.4448 3.89296 13.9701 4.11362C13.4435 4.34647 12.8278 4.10835 12.5949 3.58165C12.3621 3.05505 12.6002 2.43934 13.1269 2.20649C13.5662 2.00867 13.9389 1.8172 14.2928 1.63607C16.0292 0.740864 17.4095 0.0329376 22.9121 0.0329376C26.5328 -0.151705 30.1516 0.432964 33.53 1.74849C33.9131 1.8901 34.2962 2.03375 34.7001 2.16492C35.2474 2.34058 35.5488 2.92681 35.3731 3.4742C35.2326 3.9116 34.822 4.20535 34.3627 4.19686Z" fill="#326699" />
    <path d="M42.6903 18.7708C42.2376 18.7705 41.837 18.4776 41.6993 18.0462C41.1584 16.6784 40.4965 15.3615 39.7214 14.1114C39.4201 13.6215 39.5729 12.9803 40.0628 12.679C40.5527 12.3777 41.1939 12.5306 41.4952 13.0205C42.3593 14.4134 43.0911 15.8841 43.6812 17.4134C43.856 17.961 43.5537 18.5468 43.006 18.7215C42.904 18.7541 42.7974 18.7708 42.6903 18.7708Z" fill="#326699" />
  </g>
  <defs>
    <clipPath id="clip0">
      <rect width="50" height="50" fill="white" />
    </clipPath>
  </defs>
</svg>
  `;
  return <SvgXml xml={xml} {...props} />;
});
