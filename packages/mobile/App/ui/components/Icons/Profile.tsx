import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';

export const ProfileIcon = memo(props => {
  const xml = `
  <svg width="100%" height="100%" viewBox="0 0 174 174" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M169 86.5002C169 132.624 131.624 170 85.5 170C39.3762 170 2 132.624 2 86.5002C2 40.3764 39.3762 3.00019 85.5 3.00019C131.723 3.00019 169 40.3764 169 86.5002Z" fill="#FFD943" />
  <g clipPath="url(#clip0)">
    <path d="M52.7589 53.3848C52.7589 53.3848 54.1151 39.7309 55.4712 34.2502C56.9243 28.6733 80.9476 22.231 95.4778 25.1156C109.911 28.0002 118.92 38.0963 118.823 49.0579C118.726 47.8079 117.854 36.2694 101.774 30.6925C84.8223 24.731 65.4487 32.7117 63.9956 35.5963C62.5426 38.4809 59.8303 57.1348 60.1209 59.3463C60.1209 59.3463 41.5222 60.7886 27.7669 51.654C27.7669 51.654 43.4596 54.3463 52.7589 53.3848ZM119.792 76.8463C113.786 74.3463 105.552 75.3079 104.002 76.8463C102.452 78.3848 99.2556 87.2309 96.059 91.4617C92.8623 95.5963 87.0503 107.135 88.7939 116.366C90.4406 125.5 92.5717 133.481 96.5433 135.596C100.418 137.712 107.296 139.442 109.039 139.442C109.039 139.442 94.0248 140.789 83.0787 135.981C83.0787 135.981 90.3438 133.866 89.2782 126.846C88.1158 119.731 83.2724 113.481 77.2666 114.058C71.067 114.539 57.2149 120.692 66.9017 132.423C66.9017 132.423 49.9497 127.423 43.6533 111.558C37.3569 95.6925 41.4253 84.7309 50.9184 79.8271C60.4115 74.9232 75.0386 76.9425 78.3321 91.0771C81.7225 105.212 66.1267 114.539 59.2491 105.404C52.3714 96.2694 59.9272 87.904 63.9956 90.7886C68.0641 93.6732 66.1267 96.7502 64.6737 98.1925C64.6737 98.1925 66.2236 93.8655 62.4457 95.3078C58.6679 96.654 63.1238 103.096 66.8048 100.5C70.4858 97.904 71.1639 92.3271 66.1267 88.8655C61.0896 85.404 51.984 88.1925 51.3059 97.8078C50.6278 107.423 59.0554 115.308 66.8048 114.923C74.5543 114.539 80.8507 107.712 84.1442 100.308C87.5346 92.904 92.0874 90.0194 93.6373 87.2309C95.1872 84.4425 97.1245 78.8655 100.321 75.404C103.518 71.9425 111.558 67.3271 116.983 67.5194C116.983 67.5194 135.097 86.0771 129.285 90.5963C129.285 90.5963 124.344 88.6732 122.407 89.6348C122.601 89.5386 125.798 79.3463 119.792 76.8463ZM114.367 86.7502C115.723 86.8463 117.079 83.5771 114.367 82.1348C111.752 80.7886 108.458 80.7886 106.908 83.7694C105.358 86.8463 102.549 92.1348 100.999 95.3078C99.4494 98.4809 96.059 107.423 97.3183 114.923C98.5776 122.423 104.777 129.827 110.202 130.308C115.626 130.885 113.011 123.385 112.43 121.654C111.849 120.019 108.555 118.577 108.361 121.654C108.361 121.654 108.264 123 109.33 123.096C110.395 123.192 109.427 121.462 109.427 121.462C109.427 121.462 111.945 121.846 111.267 124.827C110.686 127.808 104.874 123.673 102.065 117.519C99.2556 111.366 99.1588 110.404 99.1588 110.404C99.1588 110.404 107.199 115.019 111.655 116.173C116.111 117.327 117.951 115.981 117.951 115.981C117.951 115.981 116.595 117.231 117.079 121.366C117.564 125.5 118.048 133.673 115.045 136.077C112.042 138.481 104.874 138.192 100.999 135.212C97.1245 132.231 91.5062 125.019 91.7968 110.5C92.1843 95.8848 99.3525 91.9425 103.518 81.7502C107.683 71.5579 121.535 78.6732 120.76 83.5771C119.985 88.4809 116.208 92.904 111.752 90.2117C107.296 87.5194 111.558 82.4232 113.398 84.8271C113.689 85.0194 112.914 86.5578 114.367 86.7502ZM75.5229 130.116C78.9133 128.962 75.8135 126.366 74.2637 126.462C72.7138 126.558 73.8762 128.192 73.8762 128.192C72.1326 128.192 70.0015 126.462 71.7451 123.096C73.3918 119.635 79.6883 120.596 82.0131 123C84.3379 125.404 85.5972 130.404 82.11 132.712C78.6227 135.019 73.3918 133.289 73.3918 133.289C82.788 134.154 82.9818 126.942 79.4945 124.539C74.9417 121.269 72.8106 125.5 72.8106 125.5C74.6511 124.154 77.5572 123.481 79.4945 127.327C81.0444 130.5 76.6854 135.212 69.2265 130.692C61.7677 126.077 68.7422 118.577 73.295 116.366C77.9446 114.154 87.5346 117.423 88.1158 126.173C88.6001 134.923 80.8507 135.212 80.8507 135.212C88.8907 130.789 86.469 124.731 83.563 120.981C80.657 117.327 70.8733 118.289 69.7109 122.808C68.3547 127.327 72.2294 131.269 75.5229 130.116ZM40.1661 135.212C43.0721 135.981 48.3999 130.212 48.3999 130.212L50.2403 131.462C50.2403 131.462 41.8128 141.077 37.4537 136.366C33.0947 131.654 43.6533 126.462 43.6533 126.462L45.7844 127.712C39.1005 130.981 37.26 134.442 40.1661 135.212ZM106.811 42.1348C94.0248 40.8848 78.9133 44.5386 75.0386 48.7694C71.1639 53.0963 71.8419 60.8848 72.6169 63.4809C73.4887 66.0771 73.5856 68.7694 73.5856 68.7694C73.5856 68.7694 62.252 73.0963 53.8245 71.9425C45.3969 70.7886 40.3598 62.3271 40.3598 62.3271C40.3598 62.3271 48.5936 64.4425 54.5025 64.5386C60.4115 64.6348 64.48 63.0002 64.48 63.0002C64.48 63.0002 64.7706 49.2502 66.9017 43.6733C69.0328 38.0963 72.2294 36.1733 81.9162 35.0194C91.6031 33.8656 103.808 34.9233 108.555 36.9425C113.302 39.0579 121.535 45.7886 117.273 54.154C117.176 54.3463 119.501 43.3848 106.811 42.1348ZM26.7983 137.616C26.0233 136.75 25.3452 135.885 24.5703 135.019C24.8609 134.827 25.1515 134.635 25.4421 134.539C28.6387 133.385 29.5106 137.327 29.5106 137.327C29.5106 137.327 27.3795 136.077 26.7983 137.616ZM65.8361 161.654C65.8361 161.654 60.7021 154.442 66.1267 145.692C66.1267 145.692 50.1435 136.75 49.2717 136.654C49.2717 136.654 42.0066 144.25 32.3197 143.481C31.6417 142.904 30.9636 142.231 30.3824 141.654C29.5106 140.789 28.6387 139.827 27.7669 138.962C29.6074 139.058 32.6103 137.808 31.3511 135.308C29.8012 132.231 24.9578 130.885 22.2454 132.135C19.0488 127.808 16.3365 123.096 14.1085 118.192C14.7866 118.192 15.3678 118.192 16.0459 118.096C27.5732 116.846 33.2884 108.385 33.2884 108.385C33.2884 108.385 36.1945 119.539 42.394 125.596C42.394 125.596 28.9293 130.5 34.5477 136.942C40.1661 143.385 51.1122 132.519 51.1122 132.519C51.1122 132.519 64.3831 140.308 78.3321 142.808C78.3321 142.616 70.0015 158.577 65.8361 161.654ZM72.0357 162.231C73.0044 161.269 73.7793 160.212 74.5543 159.058C76.0073 156.75 77.2666 154.25 78.9133 151.654C79.882 150.116 80.657 148.577 81.4319 147.135C82.2068 145.692 82.9818 144.346 83.6599 143.385C84.1442 142.712 84.5317 142.135 84.9192 141.75C85.1129 141.558 85.3066 141.366 85.5004 141.269C85.6941 141.173 85.791 141.173 85.9847 141.173C85.9847 141.173 85.9847 141.173 86.0816 141.173C86.6628 141.269 87.4377 141.366 88.2127 141.558C89.0845 141.75 90.0532 141.942 91.2156 142.231C93.4436 142.712 96.3496 143.192 100.031 143.289C100.612 143.289 101.096 143.289 101.677 143.289C104.002 143.289 106.618 143.096 109.136 142.712C111.655 142.327 114.076 141.654 116.111 140.692C117.467 140.019 118.629 139.25 119.598 138.289C120.082 137.712 120.567 137.135 120.857 136.366C121.342 135.212 121.729 133.866 121.923 132.423C122.117 130.981 122.213 129.442 122.213 128C122.213 125.308 122.02 122.712 121.923 120.885C121.923 120.308 121.826 119.827 121.826 119.442C121.826 119.25 121.826 119.058 121.826 118.962C121.826 118.769 121.923 118.577 122.117 118.289C122.213 118 122.407 117.712 122.698 117.423C123.182 116.846 123.763 116.173 124.344 115.5C124.732 115.019 125.023 114.539 125.313 114.058C125.507 113.673 125.604 113.192 125.604 112.712C125.604 112.039 125.41 111.462 125.216 110.885C125.023 110.308 124.732 109.731 124.538 109.25C124.344 108.866 124.151 108.481 123.957 108.192C124.054 108 124.248 107.904 124.344 107.712C124.732 107.231 125.119 106.558 125.507 105.981C125.701 105.596 125.991 105.212 126.185 104.827C126.282 104.635 126.379 104.442 126.476 104.25C126.476 104.154 126.572 104.058 126.572 103.962C126.572 103.866 126.572 103.866 126.572 103.769V103.673C126.572 103.481 126.572 103.289 126.476 103.096C126.379 102.904 126.379 102.808 126.282 102.712C126.185 102.423 125.991 102.135 125.798 101.846C125.41 101.269 125.023 100.596 124.635 99.8271C124.538 99.6348 124.441 99.4425 124.441 99.154C124.344 98.8655 124.344 98.5771 124.248 98.2886C124.151 97.7117 124.151 97.0386 124.151 96.5578C124.151 96.4617 124.151 96.3655 124.151 96.2694C124.635 96.2694 125.313 96.1732 126.088 95.9809C127.444 95.6925 129.091 95.1155 130.738 93.9617C131.9 93.1925 132.966 92.2309 134.031 90.9809C134.419 90.5002 134.613 90.0194 134.806 89.5386C135 88.9617 135 88.4809 135 87.904C135 86.4617 134.516 84.9232 133.934 83.2886C133.256 81.654 132.288 80.0194 131.319 78.3848C129.188 75.1155 126.572 71.8463 124.538 69.3463C123.182 67.7117 121.923 66.3655 121.342 65.6925C120.857 65.1155 120.47 64.5386 120.276 64.0579C120.082 63.5771 119.985 63.0002 119.985 62.4232C119.985 61.9425 120.082 61.4617 120.179 60.7886C120.276 60.2117 120.47 59.5386 120.76 58.7694C121.245 57.2309 121.923 55.404 122.698 53.0963C123.182 51.7502 123.376 50.3079 123.376 48.7694C123.376 46.654 122.988 44.3463 122.504 42.1348C122.02 39.9233 121.342 37.7117 120.664 35.7886C119.307 31.9425 117.951 29.0579 117.951 29.0579C117.951 29.0579 114.464 22.5194 108.846 14.154C108.168 13.0963 108.168 13.0963 106.618 10.8848C100.418 2.90404 86.0816 3.00019 86.0816 3.00019C62.8332 3.00019 41.8128 12.3271 26.6045 27.4233C11.3962 42.5194 2 63.3848 2 86.4617C2 109.539 11.3962 130.404 26.6045 145.5C37.7444 156.558 51.8871 164.442 67.8704 168L72.0357 162.231Z" fill="#2F4358" />
  </g>
  <defs>
    <clipPath id="clip0">
      <rect x="2" y="3.00019" width="133" height="166" fill="white" />
    </clipPath>
  </defs>
</svg>
  `;
  return <SvgXml xml={xml} {...props} />;
});
