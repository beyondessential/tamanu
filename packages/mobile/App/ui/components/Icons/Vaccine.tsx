import React, { ReactElement, memo } from 'react';
import { SvgXml } from 'react-native-svg';

export const VaccineIcon = memo(
  ({ ...props }): ReactElement => {
    const xml = `<svg width="174" height="174" viewBox="0 0 174 174" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M169 86.5002C169 132.624 131.624 170 85.5 170C39.3762 170 2 132.624 2 86.5002C2 40.3764 39.3762 3.00019 85.5 3.00019C131.723 3.00019 169 40.3764 169 86.5002Z" fill="#FFD943" />
  <g clipPath="url(#clip0)">
    <path d="M81.112 19.4566C81.3115 19.7553 81.3115 20.1534 80.9126 20.3525C80.8128 20.4521 72.2363 26.1259 69.444 28.8136C66.4522 31.6007 63.3607 34.9851 62.0642 42.1521C61.9645 42.5503 61.6653 42.7494 61.2664 42.6498C60.8675 42.5503 60.668 42.2517 60.668 41.8535C62.0642 34.3879 65.2555 30.8044 68.4467 27.8181C71.3388 25.1305 79.7158 19.4566 80.1148 19.2576C80.4139 19.0585 80.9126 19.158 81.112 19.4566ZM110.432 41.8535C110.531 42.2517 110.232 42.5503 109.833 42.6498C109.434 42.7494 109.036 42.4508 109.036 42.1521C107.739 34.9851 104.648 31.7003 101.656 28.8136C98.8634 26.2255 90.2869 20.4521 90.1872 20.3525C89.888 20.1534 89.7882 19.7553 89.9877 19.4566C90.1872 19.158 90.6858 19.0585 90.985 19.2576C91.3839 19.4566 99.7609 25.1305 102.653 27.8181C105.745 30.8044 108.936 34.3879 110.432 41.8535ZM120.005 88.9367C119.108 73.6073 118.21 59.0742 117.712 51.8077C117.512 48.8214 117.313 45.9347 116.914 43.1475C116.316 38.9668 115.219 34.8856 112.925 31.0035C110.631 27.1213 107.141 23.4383 102.154 19.8548L94.7746 14.6786C93.4781 13.7828 92.4809 12.9864 91.5833 12.4887C90.2869 11.5929 89.4891 11.0952 88.4918 10.5974C87.9932 10.3984 87.3948 10.1993 86.8962 10.0997C86.2978 10.0002 85.8989 10.0002 85.5 10.0002C85.3005 10.0002 85.0014 10.0002 84.6025 10.0002C84.0041 10.0997 83.306 10.1993 82.8074 10.3984C81.9098 10.7965 81.2118 11.1947 80.2145 11.8915C79.2172 12.4887 78.0205 13.3846 76.3251 14.5791L68.9454 19.8548C65.5546 22.2438 62.862 24.6328 60.7678 27.1213C57.6762 30.9039 55.8811 34.8856 54.8839 38.9668C53.8866 43.048 53.5874 47.2287 53.2883 51.8077C52.7896 59.0742 51.8921 73.6073 50.9945 88.9367L49.0997 121.089C49.0997 121.785 49 122.383 49 123.079C49 127.857 50.097 132.138 51.9918 135.821C54.7842 141.395 59.0724 145.675 63.5601 149.159C68.0478 152.544 72.735 155.132 76.3251 157.123C77.821 157.919 79.1175 158.616 80.1148 159.213C80.6134 159.512 81.0123 159.81 81.3115 160.009C81.6107 160.208 81.8101 160.408 81.8101 160.408C82.3087 161.005 83.0068 161.403 83.7049 161.602C84.403 161.901 85.0014 162 85.5 162C85.9986 162 86.6967 161.901 87.2951 161.702C87.9932 161.403 88.5915 161.005 89.0902 160.507C89.1899 160.408 89.2896 160.308 89.6885 160.109C90.1872 159.81 90.8852 159.313 91.6831 158.914C92.5806 158.417 93.5779 157.919 94.6749 157.222C97.0683 155.928 99.9604 154.335 102.952 152.345C107.44 149.458 112.127 145.874 115.817 140.997C117.612 138.608 119.208 135.92 120.305 132.934C121.402 129.948 122 126.663 122 123.079C122 122.482 122 121.785 121.9 121.089L120.005 88.9367ZM87.7937 146.173C87.7937 146.173 87.2951 146.472 86.6967 146.77C86.1981 145.078 85.8989 143.087 85.8989 140.698C85.8989 140.499 85.6995 140.4 85.5997 140.4C85.4003 140.4 85.3005 140.499 85.2008 140.698C85.2008 140.798 85.0014 143.585 84.2036 146.671C83.7049 146.372 83.306 146.173 83.306 146.173C81.112 144.979 78.6189 143.585 76.2254 142.092C72.6352 139.802 69.1448 137.115 66.6516 134.029C65.4549 132.436 64.3579 130.744 63.6598 128.952C62.9617 127.161 62.5628 125.17 62.5628 122.98V121.785V121.487L64.7568 121.387L65.3552 107.551C64.8566 107.551 64.1585 107.551 63.4604 107.65L64.5574 89.733C65.2555 78.4848 65.8538 67.6348 66.3525 59.8705C67.25 59.771 68.0478 59.6714 68.0478 59.6714C68.0478 57.382 68.9454 43.7448 68.9454 43.7448C68.6462 43.7448 68.1475 43.7448 67.7486 43.8443C67.9481 42.7494 68.1475 41.6544 68.4467 40.7585C69.0451 38.7677 69.8429 37.0755 71.1393 35.3833C72.4358 33.6911 74.3306 31.9989 76.9235 30.1076L79.3169 28.4154C80.7131 29.809 82.209 31.6007 83.306 33.6911C81.9098 34.2883 80.9126 35.6819 80.9126 37.2746V44.9393C77.0232 45.0388 73.0342 45.3375 69.1448 45.8352L68.4467 57.4815C79.7158 55.8889 91.0847 55.7893 102.354 57.2824C102.454 57.2824 101.755 45.6361 101.656 45.6361C97.7664 45.2379 93.7773 44.9393 89.7883 44.8397V37.175C89.7883 35.6819 88.8907 34.3879 87.5943 33.6911C88.6913 31.5012 90.1872 29.7094 91.5833 28.3158L93.9768 30.0081C96.3702 31.7003 98.0656 33.1934 99.362 34.6865C100.359 35.7815 101.057 36.976 101.556 38.1705C102.354 39.8627 102.852 41.6544 103.251 43.8443C102.753 43.7448 102.354 43.7448 101.955 43.7448C101.955 43.7448 102.852 57.2824 102.852 59.6714C102.852 59.6714 103.65 59.771 104.548 59.8705C105.046 67.6348 105.645 78.4848 106.343 89.733L107.44 107.65C106.842 107.551 106.143 107.551 105.645 107.551L106.243 121.387L108.437 121.487V121.785V123.079C108.437 125.966 107.739 128.455 106.542 130.744C104.747 134.228 101.755 137.115 98.3648 139.703C94.974 142.291 91.1844 144.381 87.7937 146.173ZM91.3839 154.435C91.3839 154.336 91.2842 154.236 91.2842 154.236C91.2842 154.236 90.7855 153.838 90.0874 153.141C91.3839 152.544 97.4672 149.956 103.451 145.178C112.327 138.21 116.714 130.147 116.116 121.885C116.116 121.487 115.717 121.288 115.318 121.288C114.919 121.288 114.62 121.586 114.62 121.984C116.016 140.997 89.4891 151.847 89.1899 151.946C89.1899 151.946 89.1899 151.946 89.0902 151.946C88.791 151.548 88.3921 151.051 88.0929 150.453C88.6913 150.155 89.1899 149.856 89.7883 149.458C98.8634 144.481 112.426 137.015 112.426 122.98C112.426 122.482 112.426 122.084 112.426 121.586V121.487C112.426 121.487 112.426 121.487 112.426 121.387C112.426 121.288 112.426 121.288 112.426 121.188C112.327 119.297 111.728 110.039 111.628 107.85L110.531 89.4344C109.833 78.3853 109.235 67.8339 108.736 60.0696C108.537 57.0834 108.337 54.4953 108.238 52.4049C107.44 40.7585 106.941 34.2883 96.4699 26.9223L88.9904 21.6466C87.5943 20.6511 86.2978 19.7553 85.5 19.158C84.7022 19.7553 83.4057 20.6511 82.0096 21.6466L74.5301 26.9223C66.6516 32.3971 64.4577 37.4737 63.4604 44.5411H63.3607C63.2609 44.9393 63.1612 46.731 62.9617 49.0205C62.9617 49.4187 62.862 49.8168 62.862 50.215C62.5628 54.5948 62.1639 59.9701 62.1639 59.9701C62.1639 59.9701 62.1639 59.9701 62.2637 59.9701C61.765 67.7343 61.1667 78.2857 60.4686 89.3348L59.3716 107.75C59.3716 108.049 59.3716 108.447 59.2719 108.845L58.474 121.487C58.474 121.487 58.474 121.487 58.474 121.586C58.474 121.686 58.474 121.686 58.474 121.686C58.474 122.184 58.474 122.582 58.474 123.079C58.474 137.115 72.0369 144.58 81.112 149.557C81.7104 149.856 82.3087 150.155 82.8074 150.453C82.6079 150.951 82.3087 151.449 82.0096 151.946C80.4139 151.25 55.2828 140.4 56.679 121.984C56.679 121.586 56.3798 121.288 55.9809 121.288C55.582 121.288 55.2828 121.586 55.1831 121.885C54.5847 130.147 58.9727 138.21 67.8484 145.178C73.7322 149.757 79.6161 152.444 81.112 153.041C80.7131 153.539 80.2145 153.937 79.7158 154.236C79.6161 154.335 79.6161 154.435 79.5164 154.435C69.9426 149.06 51.9918 140.002 53.1885 121.288C54.7842 95.805 56.5792 64.1508 57.4768 52.1063C58.2746 40.0618 58.9727 31.6007 71.3388 22.9406C83.7049 14.2805 83.8046 13.8823 85.5 13.8823C87.1954 13.8823 87.2951 14.38 99.6612 22.9406C112.027 31.5012 112.725 39.9622 113.623 52.1063C114.52 64.1508 116.316 95.805 117.911 121.288C119.008 140.002 101.057 149.06 91.3839 154.435ZM89.7883 118.301V132.138C89.7883 134.328 87.8934 136.119 85.5 136.119H85.1011C82.8074 136.119 80.9126 134.328 80.9126 132.138V118.401C75.7268 118.501 70.4413 118.799 65.2555 119.098L65.7541 109.741C78.918 108.945 92.1817 108.845 105.346 109.542L105.645 118.799C100.359 118.501 95.0738 118.301 89.7883 118.301ZM67.3497 64.7481V64.549L67.5492 64.6485C69.444 65.4449 71.638 65.1462 73.4331 64.549L73.1339 63.7527L74.5301 61.065L74.7295 60.7664L74.929 61.1646L76.026 63.454C77.123 62.8568 77.7213 62.4586 77.821 62.3591L78.0205 62.2595L78.1202 62.4586C80.4139 65.9426 80.7131 67.8339 80.7131 67.9334V68.1325H80.5137C79.8156 68.232 79.1175 68.4311 78.5191 68.6302L79.6161 70.9196C84.2036 66.1417 85.1011 60.5673 85.1011 60.4678C85.1011 60.4678 85.1011 60.4678 85.1011 60.3682C85.1011 60.3682 85.2008 60.3682 85.2008 60.2687H85.3005C85.3005 60.2687 85.3005 60.2687 85.3005 60.3682C86.3975 65.4449 88.6913 68.9288 91.2842 71.4174C91.5833 70.8201 91.8825 70.3224 91.9822 69.9242C93.6776 65.7435 92.2814 61.3637 92.2814 61.3637L92.1817 61.1646H92.3811C94.6749 60.9655 96.8689 61.2641 98.7637 62.2595C100.658 63.1554 102.254 64.6485 103.351 66.5398L103.451 66.7389L103.251 66.8384C103.251 66.8384 98.5642 68.3316 95.9713 72.0146C95.6721 72.4128 95.1735 73.2091 94.6749 74.2045C97.2678 75.8967 99.4618 76.3944 99.4618 76.3944C99.4618 76.3944 99.5615 76.3944 99.5615 76.494C99.5615 76.494 99.5615 76.5935 99.4618 76.5935C92.4809 82.566 90.3866 89.0362 89.9877 93.5156L94.974 104.167L93.179 106.157L92.9795 106.356L92.6803 105.958L90.6858 101.778C89.6885 103.569 87.7937 105.859 84.6025 105.859C81.3115 105.859 79.4167 103.47 78.4194 101.578C76.5246 104.465 75.3279 105.759 74.7295 105.461C73.832 105.062 75.7268 100.683 80.015 92.3211C79.0178 82.6655 70.9399 76.7926 70.8402 76.6931L70.7404 76.5935C70.7404 76.5935 70.7404 76.494 70.8402 76.494C73.5328 75.5981 75.6271 74.4036 77.4221 73.01L75.9262 69.7251C72.6352 71.5169 71.9372 73.8063 71.9372 73.9059V74.105L71.7377 74.0054C66.153 70.621 67.3497 64.8476 67.3497 64.7481Z" fill="#2F4358" />
  </g>
  <defs>
    <clipPath id="clip0">
      <rect x="49" y="10.0002" width="73" height="152" fill="white" />
    </clipPath>
  </defs>
</svg>
`;
    return <SvgXml xml={xml} {...props} />;
  },
);
