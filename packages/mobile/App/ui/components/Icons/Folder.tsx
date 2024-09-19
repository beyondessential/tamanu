import React, { memo } from 'react';
import SvgXml from 'react-native-svg';

export const Folder = memo(props => {
  const xml = `
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g clipPath="url(#clip0)">
    <path d="M28.5117 7.02539H16.3374L13.2869 3.26685C12.6355 2.47412 11.6799 2 10.6538 2H3.3562C1.48047 2 -0.0625 3.55713 -0.0625 5.43286V25.6123C-0.0625 27.481 1.48047 29.0383 3.3562 29.0383H28.5188C30.3945 29.0383 31.9375 27.481 31.9375 25.6052V10.4158C31.9304 8.54004 30.3875 7.02539 28.5117 7.02539ZM1.35303 25.6052V5.43286C1.35303 4.33569 2.25903 3.41553 3.3562 3.41553H10.6538C11.2483 3.41553 11.8145 3.69873 12.1897 4.16577L14.5042 7.02539H6.97314C5.10449 7.02539 3.54736 8.54004 3.54736 10.4158V27.6226H3.3562C2.25903 27.6226 1.35303 26.7024 1.35303 25.6052ZM30.5149 25.6052C30.5149 26.6953 29.6089 27.6226 28.5117 27.6226H4.96289V10.4158C4.96289 9.32568 5.88306 8.44092 6.97314 8.44092H28.5117C29.6018 8.44092 30.5149 9.32568 30.5149 10.4158V25.6052Z" fill="black" />
    <path d="M20.6045 14C20.1627 14 19.801 14.3474 19.801 14.7724C19.801 15.1974 20.1627 15.5449 20.6045 15.5449C22.1395 15.5449 23.3932 16.7577 23.3932 18.2408C23.3932 19.7241 22.1395 20.929 20.6045 20.929H18.5553L19.6965 19.6391C19.9858 19.3146 19.9456 18.8203 19.608 18.5421C19.2707 18.264 18.7643 18.3026 18.4749 18.6194L16.1929 21.1762C16.1929 21.1762 16.1929 21.1762 16.1849 21.1839C16.1768 21.1917 16.1688 21.1994 16.1608 21.2071C16.1527 21.2149 16.1447 21.2303 16.1366 21.238C16.1286 21.2458 16.1206 21.2535 16.1206 21.2689C16.1125 21.2767 16.1045 21.2921 16.0965 21.2998C16.0884 21.3076 16.0884 21.323 16.0804 21.3308C16.0723 21.3385 16.0723 21.3539 16.0643 21.3617C16.0563 21.3694 16.0563 21.3848 16.0482 21.3926C16.0402 21.408 16.0402 21.4158 16.0322 21.4312C16.0322 21.4389 16.0241 21.4544 16.0241 21.4621C16.0241 21.4776 16.0161 21.4853 16.0161 21.5008C16.0161 21.5085 16.008 21.5239 16.008 21.5317C16.008 21.5471 16 21.5626 16 21.578C16 21.5857 16 21.5935 16 21.6089C16 21.6321 16 21.655 16 21.6782L16.008 21.6859C16.008 21.7091 16.008 21.7323 16.008 21.7555C16.008 21.7632 16.008 21.7709 16.008 21.7864C16.008 21.8018 16.008 21.8173 16.0161 21.8327C16.0161 21.8405 16.0241 21.8559 16.0241 21.8637C16.0241 21.8791 16.0322 21.8868 16.0322 21.9023C16.0322 21.91 16.0399 21.9255 16.0399 21.9332C16.048 21.9409 16.048 21.9564 16.056 21.9641C16.064 21.9718 16.064 21.9873 16.0721 21.995C16.0801 22.0027 16.0801 22.0182 16.0884 22.0259C16.0962 22.0336 16.0962 22.0491 16.1042 22.0568C16.1123 22.0646 16.1203 22.08 16.1283 22.0877C16.1364 22.0955 16.1447 22.1109 16.1447 22.1186C16.1524 22.1264 16.1608 22.1418 16.1688 22.1495C16.1766 22.1573 16.1846 22.165 16.1929 22.1805C16.1929 22.1805 16.1929 22.1882 16.201 22.1882L18.483 24.7296C18.6437 24.9073 18.8688 25 19.0939 25C19.2785 25 19.4634 24.9382 19.6161 24.8146C19.9537 24.5364 19.9858 24.0576 19.6965 23.733L18.5553 22.4738H20.6045C23.0315 22.4738 25 20.5658 25 18.233C25 15.9 23.0234 14 20.6045 14Z" fill="black" />
    <path d="M16.4997 17.3788L18.7755 14.8208C18.7755 14.8208 18.7755 14.8134 18.7836 14.8134C18.7916 14.8056 18.7996 14.7979 18.8076 14.7899C18.8156 14.7824 18.8236 14.7667 18.8317 14.7593C18.8397 14.7515 18.8477 14.7438 18.8477 14.7283C18.8557 14.7206 18.8637 14.7052 18.8717 14.6974C18.8798 14.6897 18.8798 14.6742 18.8878 14.6665C18.8958 14.6588 18.8958 14.6433 18.9038 14.6356C18.9118 14.6279 18.9118 14.6124 18.9198 14.6047C18.9279 14.5892 18.9279 14.5815 18.9359 14.566C18.9359 14.5583 18.9439 14.5428 18.9439 14.5351C18.9439 14.5196 18.9519 14.5119 18.9519 14.4965C18.9519 14.4887 18.9599 14.4733 18.9599 14.4655C18.9599 14.4501 18.9679 14.4346 18.9679 14.4192C18.9679 14.4114 18.9679 14.4037 18.9679 14.3882C18.9679 14.365 18.984 14.3419 18.984 14.3187L19 14.3109C19 14.2878 18.984 14.2646 18.984 14.2414C18.984 14.2336 18.976 14.2262 18.976 14.2105C18.976 14.195 18.9679 14.1795 18.9679 14.1643C18.9679 14.1566 18.9599 14.1412 18.9599 14.1334C18.9599 14.118 18.9522 14.1102 18.9522 14.0948C18.9522 14.0871 18.9442 14.0716 18.9442 14.0639C18.9361 14.0484 18.9361 14.0407 18.9279 14.0252C18.9201 14.0175 18.9201 14.002 18.9121 13.9943C18.9041 13.9866 18.9041 13.9711 18.8961 13.9634C18.8878 13.9556 18.888 13.9402 18.8798 13.9325C18.8717 13.9247 18.864 13.9093 18.8557 13.9015C18.8477 13.8938 18.8397 13.8861 18.8397 13.8706C18.8317 13.8629 18.8236 13.8474 18.8156 13.8397C18.8076 13.832 18.7996 13.8242 18.7916 13.8165C18.7916 13.8165 18.7916 13.8088 18.7836 13.8088L16.5077 11.2666C16.2191 10.9419 15.7144 10.911 15.3777 11.1893C15.041 11.4675 15.0089 11.9465 15.2975 12.2711L16.4275 13.5231H14.3839C11.9635 13.5231 10 15.4317 10 17.7653C10 20.0991 11.9638 22 14.3839 22C14.8248 22 15.1853 21.6599 15.1853 21.227C15.1853 20.7945 14.8248 20.4544 14.3839 20.4544C12.8533 20.4544 11.603 19.2411 11.603 17.7653C11.603 16.2894 12.8533 15.0762 14.3839 15.0762H16.4275L15.2895 16.3665C15.0009 16.6911 15.041 17.1855 15.3777 17.4638C15.53 17.5875 15.7144 17.6493 15.8985 17.6493C16.1149 17.6491 16.3394 17.5563 16.4997 17.3788Z" fill="black" />
  </g>
  <defs>
    <clipPath id="clip0">
      <rect width="32" height="32" fill="white" />
    </clipPath>
  </defs>
</svg>
  `;
  return <SvgXml xml={xml} {...props} />;
});
