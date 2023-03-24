import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';

export const SickOrInjuredIcon = memo(props => {
  const xml = `
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_6775_19444)">
<path d="M39.3524 20C39.3524 23.8289 38.217 27.5718 36.0897 30.7555C33.9625 33.9391 30.939 36.4204 27.4016 37.8857C23.8641 39.3509 19.9716 39.7343 16.2163 38.9873C12.4609 38.2403 9.01144 36.3965 6.30399 33.6891C3.59654 30.9816 1.75275 27.5321 1.00577 23.7768C0.258783 20.0215 0.642161 16.129 2.10742 12.5915C3.57268 9.05407 6.05401 6.03056 9.23763 3.90333C12.4213 1.7761 16.1642 0.640701 19.9931 0.640701C25.1275 0.640701 30.0516 2.68034 33.6822 6.31091C37.3127 9.94148 39.3524 14.8656 39.3524 20Z" fill="#FFDA00"/>
<path d="M23.8488 26.0104C23.3625 27.6237 22.2586 32.1731 22.0051 33.8947C21.7515 35.6163 21.9474 35.992 21.3874 36.1671C20.8274 36.3423 19.2464 35.9874 16.7458 35.3213C14.2452 34.6553 11.3044 33.2633 10.7237 32.7378C10.1429 32.2123 10.2627 28.8198 10.3019 28.3889C10.3411 27.9579 11.9152 27.308 11.9152 27.308C20.0138 22.9706 24.5563 16.1441 24.5563 16.1441C24.5931 16.0852 24.6415 16.0343 24.6986 15.9947C24.7556 15.9551 24.8201 15.9275 24.8882 15.9136C25.1417 15.8422 26.5752 16.7733 27.0131 17.2596C27.451 17.7458 26.9002 18.2321 26.2341 19.6288C25.3237 21.7111 24.5274 23.8415 23.8488 26.0104ZM14.614 21.7445C14.614 21.7445 14.4204 22.9706 14.1761 24.812C14.6024 24.4893 15.2247 23.9938 15.6441 23.6597C15.6925 23.3232 15.734 23.0282 15.7709 22.7839C15.8078 22.5396 15.84 22.3091 15.8631 22.1685C15.8631 22.0971 15.8815 22.0418 15.8884 22.0072C15.8954 21.9726 15.8884 21.9749 15.8884 21.9657V21.9519C15.9153 21.782 15.8736 21.6083 15.7725 21.4691C15.6714 21.33 15.5191 21.2367 15.3491 21.2098C15.1792 21.1829 15.0056 21.2246 14.8664 21.3257C14.7272 21.4269 14.6339 21.5792 14.607 21.7491L14.614 21.7445ZM26.2272 33.1134C26.1166 33.0213 25.9968 32.9314 25.8838 32.8461C25.9737 31.3204 26.0083 29.8085 26.0083 28.4004C26.0083 26.3976 25.9391 24.6046 25.87 23.2863C25.439 24.3972 24.9481 25.9229 24.6946 26.7433C24.6946 27.2711 24.7108 27.8219 24.7108 28.3889C24.7108 29.5596 24.6854 30.8019 24.6255 32.0579C24.259 31.862 23.8949 31.6892 23.5538 31.5394C23.4616 31.9657 23.3763 32.4059 23.2934 32.8438L23.487 32.936C23.8304 33.0996 24.1784 33.284 24.5149 33.4845C24.7537 33.6252 24.9845 33.7791 25.2063 33.9454C25.4863 34.1473 25.7348 34.3896 25.9438 34.6645C26.0151 34.7625 26.0732 34.8694 26.1166 34.9825C26.1499 35.0661 26.1671 35.1553 26.1673 35.2453C26.1667 35.3553 26.1398 35.4635 26.0889 35.561C26.0889 35.561 26.0889 35.561 26.0544 35.5956C26.0196 35.6211 25.9816 35.642 25.9414 35.6578C25.8261 35.7005 25.7062 35.7299 25.5842 35.7454C25.4077 35.768 25.2298 35.7788 25.0518 35.7777C24.4779 35.7679 23.9058 35.7093 23.3418 35.6025L22.844 35.508C22.7679 36.0012 22.708 36.4414 22.6596 36.794C22.8117 36.8263 22.9661 36.8539 23.1205 36.8816C23.758 36.9987 24.4039 37.0642 25.0518 37.0775C25.2652 37.0783 25.4784 37.0659 25.6902 37.0406C25.8457 37.0233 25.9998 36.9948 26.1512 36.9553C26.374 36.8998 26.586 36.807 26.778 36.6811C26.878 36.6151 26.97 36.5377 27.0523 36.4506C27.1388 36.3569 27.2103 36.2504 27.2643 36.1349C27.4914 35.6826 27.536 35.1603 27.3888 34.676C27.2846 34.3387 27.1146 34.0254 26.8887 33.7542C26.6899 33.5192 26.4683 33.3046 26.2272 33.1134ZM11.7654 23.685C11.8729 22.7751 12.0267 21.8713 12.2263 20.977C12.3079 20.6125 12.411 20.2531 12.5351 19.9007C12.5834 19.7665 12.6388 19.6349 12.7011 19.5066C12.7446 19.4153 12.7963 19.3282 12.8555 19.2462C12.9911 19.0609 13.1455 18.8902 13.3164 18.7369C13.6886 18.4073 14.0897 18.1118 14.5149 17.8542C15.1462 17.4688 15.8039 17.1284 16.483 16.8355C16.7527 16.718 16.9855 16.6235 17.1606 16.5612L17.2067 16.6189C17.3312 16.7825 17.4879 16.9991 17.6677 17.2319C17.8036 17.4071 17.9511 17.5914 18.1125 17.7735C18.353 18.0561 18.6226 18.3126 18.9168 18.5387C19.0685 18.6526 19.2314 18.7506 19.4031 18.8314C19.5858 18.9168 19.7812 18.972 19.9816 18.995H20.1129C20.2546 18.9945 20.3953 18.972 20.5301 18.9282C20.7612 18.8527 20.9773 18.7373 21.1685 18.5871C21.3363 18.456 21.4942 18.3127 21.6409 18.1584C21.9168 17.8664 22.1753 17.5586 22.4153 17.2365C22.7956 16.7479 23.1735 16.2248 23.54 15.7823C23.6276 15.6739 23.7128 15.5725 23.8004 15.4757C23.4409 15.1784 22.5006 15.0148 22.4983 15.0148C22.4015 15.1347 22.3047 15.2591 22.2079 15.3836C21.9774 15.6878 21.7469 15.9989 21.5165 16.2893C21.3505 16.5082 21.1869 16.7157 21.0302 16.9023C20.8422 17.137 20.6306 17.3517 20.3987 17.543C20.3337 17.5949 20.2634 17.6397 20.189 17.6767C20.1657 17.6877 20.1408 17.6947 20.1152 17.6975C20.0405 17.6881 19.9683 17.6638 19.9032 17.626C19.8035 17.5725 19.7093 17.5092 19.622 17.437C19.4205 17.2707 19.2346 17.0863 19.0666 16.8862C18.9283 16.7272 18.7923 16.5566 18.6656 16.3907C18.5688 16.2662 18.4789 16.1464 18.3936 16.0312C18.3084 15.9159 18.2692 15.8629 18.2093 15.7869L18.0825 15.6255C18.0502 15.5864 18.0203 15.5495 17.9857 15.5126L17.9096 15.432C17.8589 15.3837 17.8041 15.3397 17.746 15.3006C17.7004 15.2709 17.6517 15.2462 17.6008 15.2268C17.5203 15.1942 17.4342 15.1777 17.3473 15.1784H17.2551L17.1445 15.1992L16.9647 15.2476C16.8449 15.2868 16.702 15.3375 16.5338 15.402C15.7139 15.726 14.9196 16.1112 14.1576 16.5543C13.7069 16.8126 13.2749 17.1021 12.8647 17.4209C12.4658 17.723 12.1093 18.0772 11.8046 18.4741C11.6991 18.6194 11.6066 18.7736 11.528 18.9351C11.3679 19.2753 11.2369 19.6284 11.1362 19.9906C10.9297 20.7359 10.7696 21.4933 10.6568 22.2584C10.4678 23.4661 10.3457 24.7106 10.2696 25.6601C10.2212 26.2824 10.1913 26.7779 10.1751 27.0429C10.5785 26.7871 11.1546 26.4598 11.528 26.2501C11.5603 25.5933 11.6386 24.6553 11.7654 23.685ZM15.8101 7.15585V7.12128H15.7571V6.53359L15.6833 6.17406L15.7594 6.15793V5.90441H16.4323L16.4784 5.83988H16.3609V4.62532H17.6769V3.72649L22.5812 3.71036V4.59997H23.1182L23.1874 4.58383V4.59997H23.4685V5.53567L24.0493 5.41352L24.1461 5.87445V5.91363L24.3028 6.65574L24.3374 6.81476L24.1484 6.85625C24.1484 6.88621 24.1715 6.91386 24.183 6.94613H24.5102V8.01089V8.15378H24.4088C24.4181 8.27823 24.4227 8.4073 24.4227 8.54097C24.4227 8.6585 24.4227 8.77143 24.4227 8.9051C24.3776 10.0761 24.0788 11.2234 23.5469 12.2676C23.1476 13.0428 22.5741 13.715 21.8714 14.2312C21.5105 14.497 21.1067 14.6989 20.6776 14.8281C20.468 14.89 20.2508 14.9226 20.0323 14.9249C19.8694 14.9233 19.7072 14.9048 19.5483 14.8696C19.3783 14.8303 19.2118 14.7772 19.0505 14.7106C18.6796 14.557 18.332 14.3522 18.018 14.1022C17.2048 13.4405 16.58 12.5765 16.2065 11.597C15.977 11.0092 15.8169 10.3966 15.7294 9.77166L15.5312 9.81545L15.2823 8.63085L15.4759 8.58706L15.2016 7.28722L15.8101 7.15585ZM21.9428 8.15839L18.8407 8.16991L15.628 8.84979L15.7594 9.46975L21.9428 8.15839ZM23.139 8.53866C23.139 8.42112 23.139 8.30819 23.1251 8.20448L17.0085 9.49971C17.0985 10.2522 17.3217 10.9826 17.6677 11.6569C17.9734 12.2549 18.4126 12.7746 18.9514 13.1757C19.1913 13.3529 19.4593 13.4884 19.7442 13.5767C19.839 13.6062 19.9375 13.6225 20.0369 13.6251C20.1044 13.6236 20.1716 13.6151 20.2374 13.5997C20.3367 13.5776 20.4339 13.5468 20.5278 13.5075C20.7863 13.399 21.0284 13.2547 21.2468 13.0789C21.8817 12.5596 22.3676 11.8812 22.655 11.113C22.9358 10.3824 23.0961 9.61104 23.1297 8.82905C23.1367 8.72995 23.139 8.63315 23.139 8.53866ZM22.3669 7.23652L19.3155 7.88183L24.2452 7.8657V7.2296L22.3669 7.23652ZM18.3982 5.89519H21.5003L23.086 5.54258L22.9546 4.92262L18.3982 5.89519ZM17.9696 4.0238V4.64606L22.2816 4.63223V4.00766L17.9696 4.0238ZM16.6536 4.91571V5.54258H18.6794L21.5349 4.93875L17.6653 4.95258V4.91801L16.6536 4.91571ZM16.059 6.19941V6.82398H17.4026L20.3987 6.19019L16.059 6.19941ZM15.5981 7.53613L15.7594 8.30359L23.964 6.56355L23.8027 5.7984L15.5981 7.53613ZM40.0046 19.9998C40.0051 24.6276 38.401 29.1123 35.4655 32.6899C32.53 36.2674 28.4449 38.7165 23.9062 39.6197C19.3674 40.5229 14.6559 39.8244 10.5745 37.6431C6.49302 35.4619 3.29417 31.933 1.52298 27.6576C-0.248202 23.3822 -0.482133 18.625 0.861054 14.1964C2.20424 9.76791 5.04143 5.94214 8.88919 3.37101C12.7369 0.79988 17.3572 -0.357518 21.9626 0.0960289C26.5681 0.549576 30.8738 2.58601 34.1461 5.85832C36.0053 7.71362 37.4796 9.91805 38.4842 12.3449C39.4888 14.7718 40.0039 17.3732 40 19.9998H40.0046ZM38.7094 19.9998C38.7101 16.5935 37.7807 13.2515 36.0215 10.3346C34.2623 7.41766 31.74 5.03643 28.7268 3.44779C25.7135 1.85915 22.3237 1.1234 18.923 1.31993C15.5223 1.51645 12.2398 2.63779 9.42965 4.56296C6.61947 6.48814 4.38829 9.14407 2.9768 12.2442C1.56531 15.3444 1.0271 18.7712 1.42021 22.1548C1.81333 25.5384 3.12286 28.7504 5.20753 31.4444C7.2922 34.1384 10.0729 36.212 13.2496 37.4416C13.2496 37.1236 13.2335 36.7986 13.2335 36.4621C13.2335 36.0335 13.2335 35.5933 13.2519 35.1439C13.667 35.3226 14.0985 35.4608 14.5402 35.5564C14.5402 35.8652 14.5402 36.1671 14.5402 36.4621C14.5402 36.9646 14.551 37.4432 14.5725 37.898C18.9847 39.2335 23.7343 38.8972 27.9143 36.953C27.9534 36.5059 27.9949 36.0127 28.041 35.4942C28.2069 33.526 28.4028 31.2213 28.5019 29.8846C28.5296 29.5205 28.5434 29.1171 28.5434 28.6885C28.5434 27.7297 28.4743 26.6442 28.3683 25.5818C28.2623 24.5193 28.1125 23.473 27.958 22.5857C27.8543 21.998 27.7506 21.4817 27.6515 21.0853C27.5647 20.7191 27.4396 20.3629 27.2782 20.0229L27.9442 18.594C28.3996 19.2545 28.7286 19.9937 28.9145 20.7742C29.0205 21.2121 29.1288 21.7514 29.2371 22.3621C29.3455 22.9729 29.4446 23.6504 29.5344 24.3603C29.7239 25.7932 29.8262 27.2363 29.841 28.6815C29.841 29.1425 29.8271 29.5735 29.7949 29.9814C29.675 31.4748 29.4469 34.1529 29.2694 36.2386C30.7178 35.4119 32.05 34.3967 33.2311 33.2195C34.969 31.4849 36.3472 29.4242 37.2865 27.1556C38.2258 24.887 38.7078 22.4552 38.7048 19.9998H38.7094Z" fill="#2F4358"/>
</g>
<defs>
<clipPath id="clip0_6775_19444">
<rect width="40" height="40" fill="white"/>
</clipPath>
</defs>
</svg>
  `;
  return <SvgXml xml={xml} {...props} />;
});
