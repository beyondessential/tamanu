import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';

export const SyncIcon = memo(props => {
  const xml = `
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M27.9283 11.6311C27.3076 6.7245 22.7862 2.00012 18.0654 2.00012C15.2942 2.00012 12.5795 3.35087 10.7639 5.46556C10.7486 5.46 10.7329 5.45531 10.7175 5.44987C10.6561 5.42806 10.5945 5.40681 10.5323 5.38718C10.5058 5.37887 10.4789 5.37168 10.4524 5.36381C10.3974 5.34743 10.3423 5.33143 10.2868 5.31681C10.2602 5.30981 10.2333 5.30362 10.2066 5.29706C10.1493 5.28293 10.0919 5.2695 10.0341 5.25725C10.0094 5.25206 9.98456 5.24725 9.95969 5.24237C9.89756 5.23012 9.83519 5.219 9.7725 5.20893C9.7515 5.20556 9.73056 5.20225 9.7095 5.19918C9.63881 5.18875 9.56787 5.17981 9.49662 5.17212C9.483 5.17068 9.46944 5.169 9.45575 5.16762C9.27869 5.15 9.10006 5.14006 8.92006 5.14006C8.54919 5.14006 8.18731 5.17825 7.8375 5.24975C7.83219 5.25081 7.827 5.25218 7.82169 5.25325C7.74094 5.27 7.66087 5.28837 7.5815 5.30868C7.569 5.31187 7.55675 5.31562 7.54431 5.31893C7.47244 5.33793 7.40094 5.35787 7.33025 5.37975C7.31319 5.385 7.29644 5.39093 7.27944 5.39637C7.21387 5.41737 7.14862 5.43906 7.08419 5.46243C7.064 5.46975 7.04419 5.47775 7.02413 5.48531C6.9635 5.50818 6.90313 5.53156 6.8435 5.5565C6.82125 5.56581 6.79931 5.57581 6.77719 5.58543C6.72056 5.61006 6.66425 5.63512 6.60862 5.66162C6.58488 5.67293 6.56156 5.68487 6.538 5.6965C6.48488 5.72275 6.43206 5.7495 6.37994 5.77743C6.35525 5.79068 6.33094 5.8045 6.3065 5.81812C6.25644 5.846 6.20669 5.87431 6.15756 5.90375C6.13238 5.91881 6.10763 5.93443 6.08269 5.94993C6.03531 5.97937 5.98831 6.00931 5.94194 6.04018C5.91656 6.05706 5.89156 6.07437 5.8665 6.09168C5.82169 6.12268 5.77719 6.15406 5.73338 6.18631C5.70813 6.20493 5.68319 6.22387 5.65825 6.24293C5.61569 6.27543 5.57356 6.30837 5.53206 6.34212C5.50719 6.36231 5.48263 6.38275 5.45819 6.40337C5.41781 6.43737 5.37787 6.47187 5.3385 6.50706C5.31419 6.52875 5.29013 6.55068 5.26625 6.57281C5.228 6.60825 5.19025 6.64425 5.153 6.68075C5.12937 6.70393 5.10594 6.72725 5.08275 6.75087C5.0465 6.78781 5.01081 6.82525 4.97563 6.86318C4.95294 6.88762 4.93038 6.91218 4.90812 6.93706C4.87381 6.9755 4.84013 7.0145 4.80694 7.05387C4.78531 7.07956 4.76369 7.10525 4.7425 7.13131C4.71006 7.17125 4.67837 7.21181 4.64712 7.25268C4.62669 7.27937 4.60625 7.30606 4.58631 7.33312C4.55569 7.37468 4.52594 7.41693 4.4965 7.45937C4.47744 7.48693 4.45825 7.51437 4.43969 7.54231C4.41088 7.58556 4.38306 7.62956 4.35544 7.67368C4.33781 7.70187 4.32006 7.72993 4.30294 7.7585C4.27588 7.80362 4.25 7.84943 4.22425 7.89537C4.20825 7.924 4.19194 7.95237 4.17644 7.98131C4.15112 8.0285 4.12706 8.07644 4.10313 8.12443C4.08888 8.15306 4.07425 8.1815 4.06044 8.21043C4.03688 8.26 4.01463 8.31025 3.99256 8.36062C3.98012 8.389 3.96719 8.41712 3.95525 8.44575C3.93331 8.49818 3.91294 8.55131 3.89263 8.60456C3.88219 8.63193 3.87119 8.65906 3.86119 8.68662C3.84087 8.74262 3.82225 8.79943 3.80375 8.85631C3.79544 8.88193 3.78644 8.90725 3.7785 8.93306C3.75975 8.99393 3.74281 9.05562 3.72613 9.11743C3.72006 9.13987 3.71331 9.16193 3.70756 9.18443C3.69012 9.25281 3.67462 9.32193 3.65981 9.39131C3.65631 9.40781 3.65206 9.42406 3.64869 9.44062C3.63213 9.52193 3.61762 9.60393 3.60475 9.6865C3.604 9.69143 3.60294 9.69631 3.60219 9.70131C3.57506 9.87893 3.55631 10.0593 3.547 10.2422C1.43269 11.6024 0 14.1112 0 16.6667C0 19.8656 2.03994 23.3624 4.80431 24.5573L5.0575 24.6667H6.66669C7.40306 24.6667 8 24.0698 8 23.3334C8 22.5971 7.40306 22.0001 6.66669 22.0001H5.63431C4.00325 21.1395 2.66669 18.7561 2.66669 16.6668C2.66669 14.8516 3.85125 12.9937 5.4495 12.2279L6.20669 11.8651V11.0254C6.20669 11.0036 6.20794 10.9719 6.211 10.9185C6.21494 10.8521 6.21494 10.8521 6.21644 10.8266L6.21688 10.6805C6.2135 10.6221 6.2135 10.6221 6.2105 10.5796C6.20744 9.34387 6.97162 8.32462 8.03537 7.95556C8.3125 7.86006 8.60956 7.80743 8.91906 7.80743C9.33806 7.80743 9.73481 7.9025 10.0891 8.07193C10.0968 8.07568 10.1045 8.07962 10.1123 8.08343C10.1388 8.09643 10.165 8.10993 10.191 8.12375C10.2046 8.131 10.2182 8.13831 10.2317 8.14575C10.2513 8.15662 10.2707 8.16793 10.2901 8.17925C10.3263 8.20056 10.3621 8.22262 10.3974 8.24562C10.4049 8.2505 10.4125 8.25512 10.4199 8.26006L10.4451 8.27681C11.1617 8.76493 11.6324 9.58712 11.6324 10.5194C11.6324 11.2557 12.2294 11.8527 12.9657 11.8527C13.7021 11.8527 14.2991 11.2557 14.2991 10.5194C14.2991 9.1685 13.7999 7.93506 12.9774 6.99043C14.2973 5.57012 16.1904 4.66656 18.0653 4.66656C21.1403 4.66656 24.3707 7.86168 25.1548 11.2504C24.7846 11.257 24.4129 11.2822 24.0466 11.3324C23.9916 11.3401 23.9916 11.3401 23.9364 11.3482C23.2083 11.4586 22.7076 12.1382 22.8179 12.8663C22.9282 13.5944 23.6079 14.0951 24.3359 13.9848C24.3721 13.9794 24.3721 13.9794 24.4084 13.9744C24.9654 13.8981 25.5873 13.9006 26.17 13.9526C26.2938 13.9636 26.3861 13.9741 26.4412 13.9814C28.2669 14.3357 29.3333 15.8127 29.3333 17.9999C29.3333 19.946 28.1766 21.5397 26.5009 21.9999H25.3333C24.5969 21.9999 24 22.5969 24 23.3332C24 24.0696 24.5969 24.6666 25.3333 24.6666H26.8204L26.9701 24.6316C29.9564 23.9339 32 21.2091 32 18.0001C32 14.9682 30.4916 12.5522 27.9283 11.6311Z" fill="black" />
    <path d="M21.3337 15.3334C20.5974 15.3334 20.0004 15.9303 20.0004 16.6667V18.0001C18.8709 17.1522 17.478 16.6664 16.0007 16.6664C12.319 16.6664 9.33398 19.6514 9.33398 23.3331C9.33398 27.0148 12.3189 29.9998 16.0007 29.9998C17.1853 29.9998 18.3297 29.6886 19.3348 29.1074C19.9723 28.7388 20.1902 27.9233 19.8216 27.2858C19.453 26.6483 18.6374 26.4303 17.9999 26.7989C17.3979 27.147 16.7134 27.3332 16.0007 27.3332C13.7917 27.3332 12.0007 25.5421 12.0007 23.3332C12.0007 21.1243 13.7917 19.3332 16.0007 19.3332C17.1624 19.3332 18.2359 19.8323 18.982 20.6668H17.3337C16.5974 20.6668 16.0004 21.2638 16.0004 22.0001C16.0004 22.7365 16.5974 23.3334 17.3337 23.3334H21.3337C22.0701 23.3334 22.667 22.7365 22.667 22.0001V16.6668C22.667 15.9304 22.0701 15.3334 21.3337 15.3334Z" fill="black" />
  </svg>
  `;
  return <SvgXml xml={xml} {...props} />;
});
