import React, { memo } from 'react';
import SvgXml from 'react-native-svg';

export const FamilyPlanningIcon = memo(props => {
  const xml = `
 <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_6775_19452)">
<path d="M39.3489 20.4487C39.5952 9.76352 31.1327 0.901861 20.4475 0.655648C9.76231 0.409435 0.900654 8.8719 0.654441 19.5571C0.408228 30.2423 8.87069 39.1039 19.5559 39.3502C30.2411 39.5964 39.1027 31.1339 39.3489 20.4487Z" fill="#FFDA00"/>
<path d="M11.4174 10.1682C11.4855 10.4348 11.5188 10.709 11.5165 10.9841C11.5165 11.0555 11.5165 11.127 11.5165 11.2146C11.4899 11.9202 11.3098 12.6115 10.9887 13.2404C10.7479 13.7064 10.4033 14.1108 9.98157 14.4227C9.76091 14.5766 9.5153 14.6912 9.2556 14.7615C9.13095 14.8003 9.00126 14.8205 8.87071 14.8214C8.77215 14.8211 8.67393 14.8095 8.57802 14.7868C8.47557 14.7642 8.37532 14.7325 8.27841 14.6923C8.05519 14.5992 7.84581 14.4759 7.65615 14.3259C7.16596 13.9277 6.78986 13.4069 6.56604 12.8163C6.36785 12.2999 6.25272 11.7554 6.22494 11.203C6.22494 11.127 6.22494 11.0555 6.22494 10.9726C6.22383 10.7401 6.24856 10.5082 6.29869 10.2812C6.34217 10.0801 6.41191 9.88559 6.50611 9.7027C6.66865 9.38548 6.90595 9.11259 7.19752 8.90758C7.36403 8.79062 7.54343 8.69318 7.7322 8.61719C7.94028 8.53442 8.15661 8.47416 8.37751 8.43743C8.54257 8.40732 8.70986 8.39113 8.87763 8.38903C9.01108 8.3913 9.14425 8.40208 9.27634 8.4213C9.52247 8.45534 9.76379 8.51799 9.9954 8.60798C10.1868 8.68207 10.3686 8.77879 10.537 8.89606C10.799 9.07713 11.0184 9.31306 11.18 9.58746C11.2832 9.77034 11.3629 9.96547 11.4174 10.1682ZM20.5232 20.938C20.5232 20.8666 20.5232 20.7974 20.5232 20.7283C20.5224 20.4904 20.5479 20.2531 20.5992 20.0207C20.5992 19.977 20.6246 19.9378 20.6361 19.894C20.1414 21.0986 19.6482 22.3039 19.1565 23.51C19.0761 23.6834 19.0377 23.8734 19.0445 24.0644C19.0513 24.2554 19.1031 24.4421 19.1957 24.6094C19.3224 24.3374 19.4423 24.0701 19.5667 23.8004C19.6629 23.5872 19.7886 23.3886 19.9401 23.2104C20.1103 23.0166 20.3245 22.8665 20.5647 22.7725C20.6963 22.7237 20.8346 22.695 20.9749 22.6873C20.9288 22.5951 20.8804 22.5052 20.8389 22.4038C20.654 21.9334 20.5473 21.4359 20.5232 20.9311V20.938ZM21.6502 22.0788C21.8144 22.513 22.0902 22.8962 22.4499 23.1897C22.5908 23.2998 22.7458 23.3905 22.9108 23.4593C22.9855 23.4889 23.0626 23.512 23.1413 23.5285C23.2116 23.5447 23.2835 23.5532 23.3556 23.5538C23.4524 23.5515 23.5484 23.5368 23.6414 23.51C23.831 23.4532 24.0095 23.3643 24.1692 23.2473C24.4784 23.0146 24.7292 22.7132 24.9021 22.3669C25.1394 21.9061 25.2717 21.3984 25.2892 20.8804C25.2892 20.8251 25.2892 20.7721 25.2892 20.7191C25.2903 20.5161 25.2647 20.3139 25.2132 20.1175C25.1724 19.9707 25.1127 19.8297 25.0357 19.6981C24.9171 19.496 24.7559 19.3222 24.5633 19.1888C24.4387 19.1028 24.305 19.0309 24.1646 18.9744C23.9936 18.9093 23.8157 18.8636 23.6345 18.8384C23.5376 18.824 23.4398 18.8163 23.3418 18.8154C23.2189 18.8177 23.0965 18.8292 22.9753 18.85C22.8128 18.8774 22.6536 18.9222 22.5006 18.9836C22.3622 19.0389 22.2307 19.1101 22.1088 19.1957C21.895 19.3461 21.721 19.5462 21.6018 19.7788C21.5322 19.9134 21.481 20.0568 21.4496 20.2051C21.4114 20.3737 21.3929 20.5462 21.3943 20.7191C21.3943 20.7721 21.3943 20.8251 21.3943 20.8804C21.4129 21.289 21.4994 21.6917 21.6502 22.0719V22.0788ZM14.9251 18.2415C14.8107 18.04 14.6533 17.8661 14.4642 17.7322C14.3412 17.6443 14.2071 17.573 14.0655 17.5202C13.8955 17.4536 13.7184 17.4072 13.5377 17.3819C13.4408 17.3675 13.343 17.3599 13.245 17.3588C13.1214 17.3611 12.9981 17.3727 12.8762 17.3934C12.718 17.4204 12.5634 17.4653 12.4153 17.5271C12.2762 17.5823 12.144 17.6535 12.0212 17.7391C11.809 17.8906 11.6359 18.0904 11.5165 18.3222C11.4465 18.4569 11.3946 18.6003 11.3621 18.7486C11.3251 18.9166 11.3066 19.0882 11.3068 19.2602C11.3068 19.3132 11.3068 19.3662 11.3068 19.4238C11.3234 19.8313 11.4075 20.2331 11.5557 20.613C11.7192 21.0475 11.9962 21.4303 12.3577 21.7216C12.4976 21.8338 12.6528 21.9254 12.8186 21.9935C12.8934 22.023 12.9705 22.0461 13.0491 22.0627C13.1194 22.0791 13.1913 22.0876 13.2634 22.088C13.3594 22.0855 13.4547 22.0708 13.5469 22.0443C13.737 21.9875 13.9156 21.8978 14.0747 21.7792C14.3865 21.5515 14.6406 21.2539 14.8168 20.9103C15.0528 20.449 15.185 19.9417 15.204 19.4238C15.204 19.3662 15.204 19.3132 15.204 19.2602C15.2058 19.0589 15.181 18.8581 15.1302 18.6633C15.0821 18.5137 15.0131 18.3717 14.9251 18.2415ZM29.1196 9.59207C28.9588 9.31777 28.7402 9.08183 28.4789 8.90067C28.3094 8.78383 28.1269 8.68714 27.935 8.61258C27.5772 8.47511 27.1982 8.40102 26.8149 8.39364C26.6472 8.39589 26.4799 8.41208 26.3148 8.44204C26.0948 8.47938 25.8793 8.53963 25.6718 8.6218C25.4814 8.69736 25.3004 8.79481 25.1325 8.91219C24.8411 9.11734 24.6038 9.3902 24.4411 9.70731C24.3479 9.89063 24.2782 10.085 24.2337 10.2858C24.1836 10.5128 24.1588 10.7447 24.16 10.9772C24.16 11.0486 24.16 11.1201 24.16 11.2077C24.1877 11.76 24.3029 12.3046 24.501 12.8209C24.7256 13.4111 25.1016 13.9317 25.5912 14.3305C25.7808 14.4806 25.9902 14.6039 26.2134 14.6969C26.3104 14.7368 26.4107 14.7684 26.513 14.7914C26.6082 14.814 26.7056 14.8256 26.8034 14.826C26.9403 14.825 27.0763 14.8032 27.2067 14.7615C27.4653 14.685 27.7087 14.5641 27.9258 14.4042C28.3482 14.0931 28.6929 13.6884 28.9329 13.2219C29.254 12.593 29.4341 11.9017 29.4607 11.1961C29.4607 11.1201 29.4607 11.0486 29.4607 10.9657C29.4634 10.6904 29.4293 10.416 29.3593 10.1498C29.3044 9.95414 29.2238 9.7666 29.1196 9.59207ZM40 20C40.0023 23.9561 38.8312 27.824 36.635 31.1145C34.4388 34.405 31.316 36.9703 27.6617 38.4858C24.0073 40.0013 19.9856 40.399 16.1053 39.6286C12.2249 38.8582 8.66015 36.9543 5.86195 34.1577C3.06375 31.3611 1.15779 27.7975 0.385147 23.9176C-0.387492 20.0376 0.00790172 16.0157 1.52132 12.3605C3.03473 8.70533 5.59817 5.58107 8.8874 3.38293C12.1766 1.1848 16.0439 0.0115249 20 0.0115242C25.3023 0.0115233 30.3877 2.11708 34.1381 5.86531C37.8885 9.61355 39.9969 14.6977 40 20ZM38.7025 20C38.7036 16.9843 37.9755 14.013 36.5802 11.3395C35.1848 8.66598 33.1637 6.36954 30.689 4.64596C28.2144 2.92239 25.3596 1.82279 22.3682 1.44093C19.3767 1.05907 16.3373 1.40627 13.509 2.45293C10.6807 3.49958 8.14752 5.21466 6.12532 7.45191C4.10313 9.68917 2.65194 12.3823 1.89548 15.3016C1.13902 18.2209 1.09973 21.2798 1.78096 24.2176C2.46219 27.1554 3.84373 29.8849 5.8078 32.1733C5.711 31.18 5.61881 30.1844 5.51971 29.1772C5.50241 29.0921 5.46577 29.0121 5.41262 28.9433C5.35947 28.8746 5.29124 28.819 5.21319 28.7808C4.12077 28.3821 3.57687 27.6608 3.57687 26.4946C3.57687 23.434 3.57687 20.3734 3.57687 17.3127C3.57687 15.9299 4.51718 15.0426 5.88155 14.9758C6.58908 14.9389 7.05924 15.1049 7.42107 15.7571C7.82209 16.4831 8.34294 17.1399 8.86841 17.882C9.38696 17.1307 9.91934 16.4485 10.3457 15.7087C10.6845 15.121 11.0993 14.9205 11.7654 14.9712C12.3554 15.0196 12.8947 15.1095 13.3533 15.5036C13.6822 15.7827 13.9145 16.1586 14.0171 16.5776C13.8957 16.5452 13.7726 16.5198 13.6483 16.5015C13.51 16.4825 13.3707 16.4717 13.2312 16.4692C13.0581 16.4713 12.8854 16.4875 12.7149 16.5176C12.4926 16.5571 12.2749 16.6189 12.065 16.702C11.8633 16.7838 11.6716 16.8881 11.4934 17.0131C11.1662 17.2452 10.8998 17.5527 10.7168 17.9097C10.6131 18.1102 10.5356 18.3232 10.4863 18.5434C10.4348 18.775 10.4093 19.0115 10.4102 19.2487C10.4102 19.3178 10.4102 19.3893 10.4102 19.4607C10.4339 19.9629 10.539 20.458 10.7214 20.9265C10.8422 21.2331 11.0034 21.5222 11.2007 21.7861C10.8784 21.7897 10.559 21.8474 10.2558 21.9567C9.78046 22.1283 9.37527 22.4524 9.10349 22.8785C8.84007 23.3105 8.70498 23.8085 8.714 24.3144C8.714 24.7522 8.714 25.1901 8.714 25.6257C8.714 26.2365 8.714 26.8472 8.714 27.4556V28.3337C8.714 28.6679 8.714 29.0044 8.714 29.3363C8.714 29.7534 8.714 30.1705 8.714 30.5854V30.6292C8.71147 30.8885 8.7456 31.1469 8.8154 31.3966C8.92168 31.7667 9.11897 32.1042 9.38927 32.3784C9.60167 32.5883 9.84591 32.7633 10.1129 32.897C10.2236 33.9502 10.3227 35.0104 10.4264 36.0682C10.7306 36.248 11.0417 36.4208 11.3482 36.5845C11.2215 35.2524 11.097 33.9203 10.9564 32.5905C10.9383 32.5051 10.9017 32.4247 10.8491 32.355C10.7965 32.2853 10.7293 32.228 10.6522 32.1871C9.94469 31.8806 9.57364 31.3851 9.58055 30.5969C9.59669 29.5506 9.58055 28.5043 9.58055 27.4556C9.58055 26.4093 9.58055 25.363 9.58055 24.3167C9.58055 23.298 10.212 22.6665 11.2284 22.6642C12.5206 22.6642 13.8127 22.6642 15.1049 22.6642C16.301 22.6642 16.9486 23.3164 16.9486 24.5241C16.9486 26.5199 16.9486 28.5135 16.9486 30.5162C16.9749 30.8787 16.8812 31.2397 16.6822 31.5437C16.4831 31.8477 16.1897 32.0778 15.847 32.1987C15.7715 32.2422 15.7066 32.302 15.6572 32.3738C15.6077 32.4455 15.5749 32.5274 15.5612 32.6135C15.363 34.4181 15.1878 36.2249 15.0104 38.0318C17.2903 38.6637 19.6701 38.853 22.0212 38.5895C21.853 37.1814 21.6548 35.7778 21.5165 34.3674C21.4681 33.8626 21.2653 33.7405 20.8043 33.7497C19.7672 33.7705 19.7788 33.7497 19.9862 32.7172C20.4241 30.5439 20.8481 28.366 21.2007 26.1604L20.1844 28.3153C19.9286 28.8615 19.6797 29.4123 19.4146 29.9562C19.1703 30.4586 18.7232 30.6476 18.2945 30.4494C17.8659 30.2512 17.7368 29.8179 17.9834 29.2786C18.7639 27.5701 19.5475 25.8639 20.3342 24.1599C20.6384 23.5077 21.0555 23.3787 21.6686 23.7589C22.1266 24.0656 22.6629 24.2345 23.214 24.2456C23.7651 24.2566 24.3077 24.1093 24.7776 23.8212C25.5865 23.3764 25.8147 23.4501 26.2157 24.2821C27.0224 25.9384 27.8298 27.597 28.6379 29.2579C28.8154 29.6197 28.8684 29.9862 28.5481 30.2973C28.4356 30.4203 28.2825 30.4985 28.1169 30.5176C27.9513 30.5366 27.7844 30.4952 27.6469 30.401C27.4543 30.2554 27.3027 30.0625 27.2067 29.841C26.626 28.6402 26.0659 27.4257 25.5013 26.2203C25.4683 26.2298 25.436 26.2413 25.4045 26.2549C25.7118 27.819 26.0191 29.3847 26.3263 30.9518C26.4669 31.6432 26.6121 32.36 26.7527 33.0629C26.8703 33.6483 26.7781 33.7543 26.1858 33.7543C25.1878 33.7543 25.2086 33.7543 25.1026 34.7615C24.985 35.8746 24.8421 36.9832 24.7062 38.094C25.0127 38.0157 25.3192 37.9258 25.628 37.8313C25.7502 36.8449 25.8746 35.8562 25.9806 34.8536C25.9806 34.7707 25.9968 34.6992 26.0037 34.6232H26.1973C26.3322 34.6249 26.467 34.6165 26.6006 34.5978C26.7219 34.5839 26.8406 34.5529 26.9532 34.5056C27.1033 34.4491 27.2394 34.3607 27.352 34.2465C27.4646 34.1323 27.551 33.9951 27.6054 33.8442C27.6572 33.6961 27.6829 33.5401 27.6815 33.3833C27.6771 33.2088 27.6563 33.0352 27.6193 32.8647C27.5056 32.2978 27.3911 31.7339 27.2759 31.1731C27.5079 31.3026 27.7684 31.3723 28.0341 31.3759C28.2469 31.3759 28.4574 31.3312 28.6518 31.2445C28.8401 31.1606 29.0119 31.0435 29.1588 30.8988C29.3171 30.7455 29.4433 30.5622 29.5299 30.3595C29.6118 30.1664 29.6534 29.9586 29.652 29.7488C29.644 29.4356 29.5652 29.1283 29.4215 28.85L26.9947 23.8765C26.8729 23.5992 26.7097 23.342 26.5107 23.1136C26.3875 22.9786 26.2397 22.8683 26.0751 22.7887C25.9502 22.7323 25.8172 22.6958 25.681 22.6803C25.9496 22.1296 26.1018 21.5294 26.1281 20.9173C26.1281 20.8435 26.1281 20.7744 26.1281 20.7075C26.13 20.4275 26.0944 20.1484 26.0221 19.8779C25.9603 19.6579 25.8713 19.4466 25.7571 19.2487C25.5746 18.9381 25.3269 18.6707 25.0311 18.4651C24.8503 18.3397 24.6554 18.2361 24.4503 18.1563C24.2176 18.0642 23.9746 18.0008 23.7267 17.9673C23.5885 17.947 23.4491 17.9362 23.3095 17.935C23.1365 17.936 22.9638 17.9514 22.7933 17.9811C22.5702 18.0205 22.3517 18.0823 22.1411 18.1655C21.9391 18.2467 21.7473 18.3511 21.5695 18.4766C21.2715 18.6902 21.0237 18.9662 20.8435 19.2856L21.74 17.1076C21.9359 16.6259 22.1272 16.1374 22.3393 15.6603C22.6273 15.0081 23.2611 14.8214 23.8742 15.1717C25.794 16.2641 27.7207 16.2849 29.6497 15.1901C30.3088 14.8145 30.9265 14.9873 31.2169 15.6833C32.3047 18.3045 33.3848 20.9303 34.4573 23.5607C34.7062 24.1692 34.4849 24.7407 33.9548 24.962C33.8189 25.02 33.6725 25.0494 33.5247 25.0482C33.377 25.0471 33.231 25.0154 33.096 24.9553C32.961 24.8952 32.8399 24.8078 32.7402 24.6987C32.6406 24.5896 32.5645 24.4611 32.5167 24.3213C31.7608 22.5167 31.0141 20.7052 30.2627 18.8961C30.2065 18.7403 30.1094 18.6026 29.9816 18.4974C29.9032 19.168 29.8179 19.841 29.7511 20.5162C29.6704 21.2768 29.569 22.0419 29.5391 22.8071C29.5165 23.2738 29.571 23.741 29.7004 24.1899C30.3688 26.3056 31.0832 28.4098 31.7746 30.5162C32.0051 31.2215 31.8852 31.3851 31.1247 31.3874C30.8113 31.3874 30.5001 31.3989 30.2028 31.3874C30.1229 31.3711 30.0403 31.3727 29.961 31.392C29.8817 31.4114 29.8077 31.448 29.7443 31.4993C29.6808 31.5507 29.6295 31.6154 29.5941 31.6889C29.5586 31.7624 29.5398 31.8428 29.5391 31.9244C29.2925 33.4524 29.032 34.9781 28.7739 36.5038C31.7686 34.9095 34.273 32.5305 36.0188 29.6215C37.7646 26.7126 38.6859 23.3834 38.684 19.9908L38.7025 20Z" fill="#2F4358"/>
</g>
<defs>
<clipPath id="clip0_6775_19452">
<rect width="40" height="40" fill="white"/>
</clipPath>
</defs>
</svg>
  `;
  return <SvgXml xml={xml} {...props} />;
});
