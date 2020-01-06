import React from 'react';
import Svg, {
  SvgProps,
  RadialGradient,
  Stop,
  ClipPath,
  Rect,
  LinearGradient,
  G,
  Path,
  Defs,
} from 'react-native-svg';

export const AppIntro3 = React.memo((props: SvgProps) => (
  <Svg width="281" height="203" viewBox="0 0 281 203" fill="none" {...props}>
    <Path
      d="M148.5 203C204.557 203 250 157.557 250 101.5C250 45.4431 204.557 0 148.5 0C92.4431 0 47 45.4431 47 101.5C47 157.557 92.4431 203 148.5 203Z"
      fill="#2B5E8F"
    />
    <G clipPath="url(#clip0)">
      <Path
        d="M222.763 150.5C222.976 149.647 223.333 148.402 223.938 147.797C224.437 147.299 225.398 146.623 226.146 146.801C226.752 146.979 227.286 147.441 227.536 148.01C227.927 148.864 227.963 150.251 227.927 151.212C227.892 151.852 228.462 152.35 229.103 152.314C229.886 152.243 230.634 152.741 230.955 153.773C231.525 155.8 230.67 158.29 229.78 160.922C229.637 161.384 229.78 161.882 230.207 162.131C231.525 162.985 230.919 166.399 230.243 168.356C230.065 168.854 230.314 169.387 230.813 169.636C233.199 170.846 231.703 176.892 230.528 179.951C229.601 182.406 230.634 183.544 230.065 185.749C228.853 190.337 222.869 188.915 221.302 184.184C220.697 182.334 221.445 181.694 220.59 179.738C220.091 178.6 218.987 177.995 218.524 176.892C215.852 170.917 217.776 166.969 219.984 166.648C220.59 166.542 221.017 165.973 220.875 165.332C220.483 163.661 219.949 160.886 219.949 158.681C219.949 156.938 220.875 155.871 221.872 155.622C222.406 155.48 222.763 154.982 222.656 154.413C222.406 153.097 222.442 151.816 222.763 150.5Z"
        fill="#598ABB"
      />
      <Path
        d="M224.829 197.593C224.437 197.593 224.9 197.131 225.078 190.053C225.185 185.998 224.793 177.106 225.648 169.245C226.111 164.799 225.755 159.961 224.935 155.693C224.9 155.515 225.185 155.444 225.22 155.622C226.075 159.997 226.396 164.87 225.933 169.281C225.47 173.655 225.292 180.449 225.363 184.789C225.434 188.843 225.363 192.756 224.971 197.451C224.971 197.522 224.9 197.593 224.829 197.593Z"
        fill="#C2DFF5"
      />
      <Path
        d="M225.114 179.133C223.154 177.177 221.552 174.865 220.376 172.375C220.305 172.197 220.554 172.091 220.626 172.268C221.801 174.758 223.368 176.999 225.327 178.955C225.47 179.062 225.256 179.24 225.114 179.133Z"
        fill="#C2DFF5"
      />
      <Path
        d="M225.22 175.967C226.681 174.509 227.714 172.731 228.248 170.774C228.284 170.597 228.569 170.668 228.533 170.846C227.999 172.837 226.93 174.651 225.434 176.181C225.292 176.288 225.113 176.074 225.22 175.967Z"
        fill="#C2DFF5"
      />
      <Path
        d="M225.078 184.433C226.503 182.868 227.607 181.089 228.355 179.133C228.426 178.955 228.711 179.062 228.64 179.24C227.856 181.232 226.752 183.046 225.292 184.646C225.185 184.789 224.971 184.575 225.078 184.433Z"
        fill="#C2DFF5"
      />
      <Path
        d="M225.861 165.937C224.579 164.443 223.439 162.771 222.513 161.029C222.478 160.957 222.513 160.886 222.584 160.815C222.834 160.673 222.763 161.064 224.08 163.056C225.755 165.581 226.324 165.724 226.075 165.937C226.004 166.008 225.897 166.008 225.861 165.937Z"
        fill="#C2DFF5"
      />
      <Path
        d="M225.684 160.673C226.538 159.321 227.358 157.899 228.106 156.511C228.213 156.334 228.462 156.476 228.355 156.654C227.571 158.076 226.752 159.464 225.933 160.851C225.826 160.993 225.577 160.851 225.684 160.673Z"
        fill="#C2DFF5"
      />
      <Path
        d="M242.781 138.869C243.101 137.589 243.671 135.703 244.562 134.743C245.31 133.961 246.806 132.929 247.91 133.249C248.836 133.498 249.619 134.21 250.047 135.063C250.652 136.344 250.688 138.478 250.617 139.901C250.581 140.897 251.4 141.644 252.398 141.572C253.573 141.501 254.749 142.213 255.212 143.813C256.067 146.872 254.749 150.642 253.431 154.662C253.217 155.338 253.466 156.12 254.072 156.511C256.067 157.827 255.176 162.985 254.143 165.973C253.894 166.755 254.25 167.538 254.998 167.929C258.596 169.779 256.316 178.92 254.571 183.615C253.146 187.35 254.713 189.057 253.858 192.436C252.042 199.407 242.923 197.238 240.537 190.053C239.61 187.243 240.715 186.247 239.432 183.259C238.684 181.516 237.01 180.627 236.262 178.955C232.202 169.85 235.122 163.91 238.506 163.412C239.432 163.269 240.074 162.345 239.86 161.42C239.254 158.859 238.435 154.697 238.435 151.354C238.435 148.686 239.824 147.05 241.356 146.694C242.175 146.481 242.709 145.698 242.567 144.88C242.211 142.817 242.282 140.825 242.781 138.869Z"
        fill="#598ABB"
      />
      <Path
        d="M246.841 200.581C246.271 200.581 246.627 198.554 246.699 197.131C246.806 195.602 246.271 177.497 247.554 165.546C248.266 158.788 247.732 151.425 246.485 144.952C246.414 144.667 246.877 144.596 246.912 144.88C248.195 151.532 248.729 158.895 248.017 165.617C247.304 172.233 247.019 182.548 247.162 189.164C247.269 192.116 247.411 198.696 247.055 200.368C247.055 200.475 246.948 200.581 246.841 200.581Z"
        fill="#C2DFF5"
      />
      <Path
        d="M246.806 180.556C243.849 177.568 241.391 174.082 239.575 170.276C239.432 170.027 239.86 169.814 239.967 170.099C241.748 173.869 244.134 177.284 247.091 180.271C247.34 180.449 247.019 180.769 246.806 180.556Z"
        fill="#C2DFF5"
      />
      <Path
        d="M246.984 175.754C249.192 173.549 250.759 170.846 251.579 167.858C251.65 167.573 252.077 167.68 252.006 167.965C251.187 171.023 249.584 173.762 247.304 176.039C247.091 176.252 246.77 175.968 246.984 175.754Z"
        fill="#C2DFF5"
      />
      <Path
        d="M246.77 188.63C248.943 186.283 250.617 183.544 251.757 180.592C251.863 180.307 252.291 180.485 252.184 180.769C251.009 183.793 249.299 186.567 247.09 188.95C246.912 189.128 246.556 188.844 246.77 188.63Z"
        fill="#C2DFF5"
      />
      <Path
        d="M247.945 160.531C245.986 158.254 244.277 155.729 242.852 153.097C242.781 152.99 242.852 152.848 242.959 152.812C243.351 152.599 243.208 153.168 245.238 156.227C247.767 160.068 248.658 160.246 248.266 160.566C248.159 160.637 248.017 160.637 247.945 160.531Z"
        fill="#C2DFF5"
      />
      <Path
        d="M247.661 152.528C248.943 150.465 250.19 148.295 251.365 146.196C251.507 145.947 251.899 146.161 251.757 146.41C250.581 148.544 249.335 150.678 248.052 152.777C247.874 153.026 247.482 152.777 247.661 152.528Z"
        fill="#C2DFF5"
      />
      <Path
        d="M11.4695 203C11.4695 203 87.0178 188.666 107.392 190.053C127.766 191.44 192.379 203 192.379 203H11.4695Z"
        fill="#598ABB"
      />
      <Path
        d="M281 203H100.09C100.09 203 175.638 188.666 196.013 190.053C216.387 191.404 281 203 281 203Z"
        fill="#598ABB"
      />
      <Path
        d="M211.079 82.2792V63.0009H209.654V43.7225C209.654 39.9878 206.627 37 202.922 37H129.119C125.379 37 122.387 40.0234 122.387 43.7225V196.277C122.387 200.012 125.415 203 129.119 203H202.887C206.627 203 209.619 199.977 209.619 196.277V123.041H211.044V89.8909H209.619V82.2792H211.079Z"
        fill="#4B4C61"
      />
      <Path
        d="M207.518 46.0344H124.845V185.109H207.518V46.0344Z"
        fill="#F2F6FE"
      />
      <Path
        d="M182.014 42.6554H152.272C151.667 42.6554 151.204 42.1574 151.204 41.5883C151.204 40.9836 151.702 40.5212 152.272 40.5212H182.014C182.62 40.5212 183.083 41.0192 183.083 41.5883C183.083 42.193 182.584 42.6554 182.014 42.6554Z"
        fill="#585870"
      />
      <Path
        d="M170.046 198.056C172.174 195.93 172.174 192.485 170.046 190.359C167.918 188.234 164.467 188.234 162.339 190.359C160.211 192.485 160.211 195.93 162.339 198.056C164.467 200.181 167.918 200.181 170.046 198.056Z"
        fill="#585870"
      />
      <Path
        d="M190.812 103.585H139.378V185.109H190.812V103.585Z"
        fill="white"
      />
      <Path
        d="M183.581 165.866H146.751V185.109H183.581V165.866Z"
        fill="#DCECF9"
      />
      <Path
        d="M186.182 148.402H143.154V157.721H186.182V148.402Z"
        fill="#57C5CC"
      />
      <Path
        d="M153.911 151.105V155.444H152.842V153.63H151.204V155.444H150.135V151.105H151.204V152.777H152.842V151.105H153.911Z"
        fill="white"
      />
      <Path
        d="M157.829 151.318C158.149 151.496 158.434 151.781 158.612 152.101C158.79 152.457 158.897 152.812 158.897 153.239C158.897 153.666 158.79 154.057 158.612 154.377C158.434 154.733 158.149 154.982 157.829 155.16C157.508 155.338 157.116 155.444 156.725 155.444C156.333 155.444 155.941 155.338 155.62 155.16C155.3 154.982 155.015 154.698 154.837 154.377C154.659 154.022 154.552 153.666 154.552 153.239C154.552 152.812 154.659 152.421 154.837 152.101C155.015 151.745 155.3 151.496 155.62 151.318C155.941 151.141 156.333 151.034 156.725 151.034C157.152 151.034 157.508 151.141 157.829 151.318ZM155.905 152.35C155.692 152.563 155.585 152.884 155.585 153.275C155.585 153.666 155.692 153.951 155.905 154.2C156.119 154.413 156.368 154.555 156.725 154.555C157.081 154.555 157.33 154.449 157.544 154.2C157.757 153.986 157.864 153.666 157.864 153.275C157.864 152.884 157.757 152.599 157.544 152.35C157.33 152.137 157.081 151.994 156.725 151.994C156.368 152.03 156.119 152.137 155.905 152.35Z"
        fill="white"
      />
      <Path
        d="M162.495 154.875C162.388 155.053 162.21 155.231 161.961 155.338C161.747 155.445 161.462 155.516 161.141 155.516C160.643 155.516 160.251 155.409 159.93 155.16C159.61 154.911 159.432 154.591 159.396 154.164H160.536C160.536 154.342 160.607 154.449 160.714 154.555C160.821 154.662 160.928 154.698 161.106 154.698C161.248 154.698 161.355 154.662 161.426 154.591C161.498 154.52 161.533 154.413 161.533 154.306C161.533 154.2 161.498 154.093 161.426 154.022C161.355 153.951 161.248 153.88 161.141 153.844C161.034 153.808 160.892 153.737 160.714 153.666C160.429 153.559 160.215 153.488 160.037 153.382C159.859 153.31 159.717 153.168 159.574 152.99C159.432 152.812 159.396 152.599 159.396 152.314C159.396 152.066 159.467 151.817 159.61 151.639C159.752 151.461 159.93 151.319 160.144 151.212C160.393 151.105 160.643 151.07 160.928 151.07C161.426 151.07 161.782 151.176 162.067 151.425C162.352 151.639 162.53 151.959 162.566 152.386H161.426C161.391 152.243 161.355 152.137 161.284 152.03C161.213 151.959 161.07 151.888 160.928 151.888C160.821 151.888 160.714 151.923 160.643 151.994C160.571 152.066 160.536 152.172 160.536 152.279C160.536 152.386 160.571 152.457 160.643 152.528C160.714 152.599 160.785 152.67 160.892 152.706C160.999 152.741 161.141 152.812 161.319 152.884C161.604 152.99 161.818 153.061 161.996 153.168C162.174 153.275 162.317 153.382 162.459 153.559C162.602 153.737 162.637 153.951 162.637 154.235C162.637 154.449 162.602 154.662 162.495 154.875Z"
        fill="white"
      />
      <Path
        d="M164.311 153.951V155.48H163.243V151.141H164.953C165.487 151.141 165.879 151.283 166.128 151.532C166.413 151.781 166.52 152.137 166.52 152.563C166.52 152.848 166.449 153.061 166.342 153.275C166.235 153.488 166.057 153.666 165.808 153.773C165.558 153.879 165.273 153.951 164.953 153.951H164.311ZM165.451 152.528C165.451 152.137 165.238 151.959 164.81 151.959H164.276V153.097H164.81C165.238 153.097 165.451 152.919 165.451 152.528Z"
        fill="white"
      />
      <Path
        d="M168.123 151.105V155.444H167.054V151.105H168.123Z"
        fill="white"
      />
      <Path
        d="M171.97 151.105V151.959H170.794V155.48H169.726V151.959H168.55V151.105H171.97Z"
        fill="white"
      />
      <Path
        d="M175.14 154.662H173.501L173.216 155.444H172.112L173.715 151.105H174.926L176.529 155.444H175.389L175.14 154.662ZM174.855 153.879L174.32 152.279L173.786 153.879H174.855Z"
        fill="white"
      />
      <Path
        d="M177.989 154.662H179.378V155.48H176.921V151.141H177.989V154.662Z"
        fill="white"
      />
      <Path
        d="M156.618 108.849H146.751V121.085H156.618V108.849Z"
        fill="#DCECF9"
      />
      <Path
        d="M183.581 108.849H173.715V121.085H183.581V108.849Z"
        fill="#DCECF9"
      />
      <Path
        d="M170.118 108.849H160.251V121.085H170.118V108.849Z"
        fill="#DCECF9"
      />
      <Path
        d="M154.089 108.849L146.751 116.176V112.833L150.776 108.849H154.089Z"
        fill="#F7F9FF"
      />
      <Path
        d="M162.887 121.085L170.117 113.9V117.243L166.235 121.085H162.887Z"
        fill="#F7F9FF"
      />
      <Path
        d="M178.345 108.991L173.715 113.615V110.272L175.14 108.849H178.203L178.345 108.991Z"
        fill="#F7F9FF"
      />
      <Path
        d="M156.19 121.085L156.618 120.658V121.085H156.19Z"
        fill="#A0C8E3"
      />
      <Path
        d="M170.118 108.849V109.205L160.251 119.057V117.065L168.443 108.849H170.118Z"
        fill="#F7F9FF"
      />
      <Path
        d="M146.751 118.88L156.618 109.027V117.599L153.127 121.085H146.751V118.88Z"
        fill="#F7F9FF"
      />
      <Path
        d="M165.38 108.849L160.251 113.971V108.849H165.38Z"
        fill="#F7F9FF"
      />
      <Path
        d="M183.581 109.667V118.204L180.696 121.085H173.715V119.484L183.581 109.667Z"
        fill="#F7F9FF"
      />
      <Path
        d="M155.834 109.667V120.302H147.57V109.667H155.834ZM156.618 108.849H146.751V121.085H156.618V108.849Z"
        fill="white"
      />
      <Path
        d="M182.798 109.667V120.302H174.534V109.667H182.798ZM183.581 108.849H173.715V121.085H183.581V108.849Z"
        fill="white"
      />
      <Path
        d="M169.298 109.667V120.302H161.035V109.667H169.298ZM170.118 108.849H160.251V121.085H170.118V108.849Z"
        fill="white"
      />
      <Path
        d="M156.618 131.222H146.751V143.458H156.618V131.222Z"
        fill="#DCECF9"
      />
      <Path
        d="M183.581 131.222H173.715V143.458H183.581V131.222Z"
        fill="#DCECF9"
      />
      <Path
        d="M170.118 131.222H160.251V143.458H170.118V131.222Z"
        fill="#DCECF9"
      />
      <Path
        d="M154.089 131.222L146.751 138.549V135.241L150.776 131.222H154.089Z"
        fill="#F7F9FF"
      />
      <Path
        d="M162.887 143.458L170.117 136.273V139.616L166.235 143.458H162.887Z"
        fill="#F7F9FF"
      />
      <Path
        d="M178.345 131.4L173.715 135.988V132.645L175.14 131.222H178.203L178.345 131.4Z"
        fill="#F7F9FF"
      />
      <Path
        d="M170.118 131.222V131.613L160.251 141.43V139.438L168.443 131.222H170.118Z"
        fill="#F7F9FF"
      />
      <Path
        d="M146.751 141.252L156.618 131.4V139.972L153.127 143.458H146.751V141.252Z"
        fill="#F7F9FF"
      />
      <Path
        d="M165.38 131.222L160.251 136.379V131.222H165.38Z"
        fill="#F7F9FF"
      />
      <Path
        d="M183.581 132.04V140.612L180.696 143.458H173.715V141.893L183.581 132.04Z"
        fill="#F7F9FF"
      />
      <Path
        d="M155.834 132.04V142.675H147.57V132.04H155.834ZM156.618 131.222H146.751V143.458H156.618V131.222Z"
        fill="white"
      />
      <Path
        d="M182.798 132.04V142.675H174.534V132.04H182.798ZM183.581 131.222H173.715V143.458H183.581V131.222Z"
        fill="white"
      />
      <Path
        d="M169.298 132.04V142.675H161.035V132.04H169.298ZM170.118 131.222H160.251V143.458H170.118V131.222Z"
        fill="white"
      />
      <Path
        d="M191.952 125.246H138.238V127.416H191.952V125.246Z"
        fill="#DCECF9"
      />
      <Path
        d="M195.015 101.415L165.166 94.7996L135.175 101.415V103.585H195.015V101.415Z"
        fill="#F47E68"
      />
      <Path
        d="M191.952 160.744H138.238V162.878H191.952V160.744Z"
        fill="#DCECF9"
      />
      <Path
        d="M161.284 54.8555C158.612 49.7335 152.486 47.5994 147.286 49.8047C145.291 43.1177 139.093 38.2092 131.756 38.2092C123.741 38.2092 117.116 44.007 115.798 51.6543C114.231 51.6187 112.628 51.9744 111.096 52.7569C106.359 55.2112 104.543 61.0089 107 65.7395C108.639 68.8696 111.738 70.7192 115.015 70.897H151.524C153.234 70.897 154.979 70.5058 156.618 69.6521C162.032 66.8422 164.098 60.2264 161.284 54.8555Z"
        fill="#57C5CC"
      />
      <Path
        d="M179.485 65.4551C177.918 62.4673 174.32 61.1868 171.257 62.5029C170.082 58.5547 166.449 55.7092 162.139 55.7092C157.437 55.7092 153.519 59.1238 152.771 63.6055C151.845 63.57 150.883 63.7834 150.028 64.2458C147.25 65.7041 146.181 69.1187 147.606 71.8931C148.568 73.7427 150.384 74.8097 152.308 74.9164H173.751C174.748 74.9164 175.781 74.6674 176.743 74.1695C179.877 72.5333 181.124 68.6207 179.485 65.4551Z"
        fill="white"
      />
      <Path
        d="M123.278 59.7285C122.031 57.3453 119.182 56.3494 116.76 57.3809C115.834 54.2508 112.948 52.01 109.529 52.01C105.789 52.01 102.726 54.7132 102.12 58.2701C101.372 58.2346 100.624 58.4124 99.9474 58.7681C97.739 59.9063 96.8842 62.6095 98.0596 64.8148C98.8076 66.2731 100.268 67.1268 101.8 67.2335H118.754C119.538 67.2335 120.357 67.0556 121.105 66.6644C123.599 65.3128 124.56 62.2538 123.278 59.7285Z"
        fill="#DCECF9"
      />
      <Path
        d="M128.942 78.331L136.635 66.1309L120.037 71.2172L122.958 73.5292L128.942 78.331Z"
        fill="#FFC212"
      />
      <Path
        d="M123.812 77.4417L122.958 73.5292L136.386 66.2375L125.059 75.2009L123.812 77.4417Z"
        fill="#F79231"
      />
      <Path
        d="M123.812 77.4418L125.914 75.9123L125.059 75.2009L123.812 77.4418Z"
        fill="#DD635A"
      />
      <Path
        d="M113.981 92.3451L124.596 80.4651L112.913 91.0646L113.981 92.3451Z"
        fill="url(#paint0_linear)"
      />
      <Path
        d="M107.392 93.9459L120.678 80.6787L106.323 92.6298L107.392 93.9459Z"
        fill="url(#paint1_linear)"
      />
      <Path
        d="M111.417 86.7966L122.601 75.6279L110.313 85.5161L111.417 86.7966Z"
        fill="url(#paint2_linear)"
      />
      <Path
        d="M106.11 193.681L108.069 198.838L103.225 199.336L101.087 193.681H106.11Z"
        fill="#E6E6E6"
      />
      <Path
        d="M102.263 196.811C102.263 196.811 102.654 198.341 103.794 198.412C105.255 198.483 107.463 198.838 107.463 197.238L115.299 199.585C115.905 199.692 116.368 200.368 116.439 201.222C116.475 201.72 116.368 202.253 115.94 202.538C115.014 203.142 107.249 203.036 103.224 202.858C102.298 202.822 101.55 201.72 101.55 200.368L102.263 196.811Z"
        fill="#544F6C"
      />
      <Path
        d="M59.0924 193.681L57.1333 198.838L61.9775 199.336L64.1147 193.681H59.0924Z"
        fill="#E6E6E6"
      />
      <Path
        d="M62.8679 196.918C62.8679 196.918 62.4049 198.447 61.4075 198.412C59.9472 198.376 58.095 198.661 57.7388 197.238L49.9025 199.585C49.297 199.692 48.834 200.368 48.7627 201.222C48.7271 201.72 48.834 202.253 49.2614 202.538C50.1875 203.142 57.9525 203.036 61.9775 202.858C62.9036 202.822 63.6516 201.72 63.6516 200.368L62.8679 196.918Z"
        fill="#544F6C"
      />
      <Path
        d="M106.858 195.637L92.04 134.565L91.2208 132.929L70.9535 132.467L70.4548 133.818L58.3799 195.602L63.046 196.526L80.7844 146.445H82.8859L102.156 196.277L106.858 195.637Z"
        fill="#56516E"
      />
      <Path
        d="M69.7781 110.983C69.7781 110.983 70.7398 112.868 71.3453 116.319C71.3453 116.319 72.1645 119.947 71.9152 124.464C71.6659 128.981 70.6685 133.214 70.6685 133.214C70.6685 133.214 71.5234 133.783 73.1263 134.352C74.2305 134.743 75.8333 135.17 78.0773 135.455C85.5574 136.451 91.8976 134.423 91.8976 134.423C91.862 133.712 91.3989 130.19 91.1496 126.954C90.7221 121.761 90.544 118.239 90.544 118.239C90.5084 113.58 91.1496 111.908 91.2208 109.098H93.821C93.7854 108.885 92.9305 102.767 89.6892 101.522C86.4122 100.241 82.5297 100.17 82.5297 100.17C77.828 100.384 74.2305 100.49 71.3097 101.024C69.1725 101.486 66.5011 103.016 66.323 104.972C66.2518 105.612 65.5038 113.046 69.7424 117.635C74.0167 122.259 74.0167 122.259 74.0167 122.259L83.064 115.109L80.6063 111.446L73.803 114.433L73.1975 107.818"
        fill="url(#paint3_linear)"
      />
      <Path
        d="M93.8211 109.063L94.9965 116.959L93.8923 118.168C93.5362 118.559 92.9662 118.595 92.5388 118.275L91.4702 117.315L91.1497 107.711L93.8211 109.063Z"
        fill="#F79D75"
      />
      <Path
        d="M91.1497 107.675L93.0375 117.67C93.1088 118.061 92.6813 118.346 92.3608 118.097C92.2539 118.026 92.147 117.919 92.0402 117.812C91.8977 117.67 90.5442 116.461 90.5442 116.461L91.1497 107.675Z"
        fill="#EC8B6C"
      />
      <Path
        d="M80.8556 98.6764C80.535 97.218 81.7817 96.2932 83.0283 96.0798C83.8119 95.9376 84.56 95.4396 85.0586 95.155C86.2341 94.5148 85.5929 91.3847 85.6641 90.5667C85.7354 89.7486 87.8725 89.7841 87.2314 88.9305C86.4834 88.397 85.9847 87.899 85.6285 87.4722C84.3462 85.8716 85.2011 84.8756 84.6668 83.0972C84.1325 81.2476 83.242 79.9671 82.9215 79.5759C82.8502 79.5047 82.8146 79.4336 82.8146 79.4336C82.8146 79.4336 82.8502 79.5047 82.8858 79.5403C83.2777 80.145 84.738 82.6348 82.9215 83.0616C73.803 85.1958 73.7673 92.3095 73.7673 92.3095C73.7673 92.3095 76.1894 94.337 76.2251 97.5737C76.2251 98.1784 76.1182 98.9253 75.9045 99.6367C75.1921 100.135 74.0523 100.526 73.8029 100.633C73.8029 100.633 75.1565 104.047 79.7514 104.047C85.0586 104.047 83.7763 100.135 83.7763 100.135C83.7763 100.135 82.2803 99.9568 81.3542 99.7079C81.3542 99.6723 80.9268 98.9609 80.8556 98.6764Z"
        fill="#F79D75"
      />
      <Path
        d="M78.2554 94.835C78.2554 94.835 78.5403 99.1388 81.3542 99.6723C81.3542 99.6368 81.3186 99.6012 81.2474 99.5301C81.2118 99.4589 81.1049 99.2811 80.9624 98.9609C80.8912 98.8187 80.7843 98.4986 80.8912 97.965C81.1405 96.5423 81.9241 96.5067 82.4584 96.5423L82.8502 95.7242C82.6365 95.7953 80.0363 95.653 78.2554 94.835Z"
        fill="#EC8B6C"
      />
      <Path
        d="M92.1113 104.154C92.9662 105.933 93.821 109.063 93.821 109.063H91.0784C91.0784 109.063 91.1496 108.422 91.114 107.462C91.0784 105.826 90.1879 102.767 89.6892 101.451C89.6892 101.451 91.4346 102.696 92.1113 104.154Z"
        fill="#D1E4F6"
      />
      <Path
        d="M81.0337 74.9165C81.0337 74.9165 82.5297 78.26 77.7211 78.7935C73.8386 79.2203 70.4548 81.7457 69.8492 86.014C69.2437 90.2823 72.6275 94.6928 76.2607 97.645C76.2607 97.645 76.2251 97.2538 76.9731 94.0881C77.7211 90.9225 76.4388 93.1633 75.6195 91.1003C74.8003 89.1085 76.4032 88.575 76.9018 89.5353C77.0087 89.7487 77.2936 90.7802 77.3649 91.207C77.4361 91.4916 77.4717 91.954 77.4717 92.452C77.5074 94.4438 78.9677 96.1156 80.9268 96.4001C81.7104 96.5068 82.6009 96.5779 83.5626 96.5779C83.8476 96.5779 84.2038 96.5779 84.5244 96.5424C85.2724 96.5068 85.8423 95.9021 85.8423 95.1552L85.8066 92.2385C85.8066 92.2385 80.6062 93.2345 79.2527 92.3097C78.8965 92.0607 78.6828 90.6379 78.6828 90.6379C78.6828 90.6379 78.291 87.6502 78.9677 85.9073C79.8582 83.6309 87.7301 83.2396 84.275 77.6197C83.7051 76.6949 82.9927 75.8413 81.0337 74.9165Z"
        fill="url(#paint4_radial)"
      />
      <Path
        d="M85.201 93.4124C85.201 93.4124 84.7023 94.3372 83.5625 93.6969"
        stroke="#CA835B"
        strokeWidth="1.2661"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />
      <Path
        d="M93.8567 118.239C95.6021 116.354 100.802 110.556 102.192 107.711L99.2708 106.181L91.3634 113.686L90.7935 116.745L92.6457 118.382C93.0019 118.631 93.5361 118.595 93.8567 118.239Z"
        fill="#EC8B6C"
      />
      <Path
        d="M99.2708 106.146L100.054 105.257C100.054 105.257 100.268 104.972 100.375 103.514C100.482 102.056 100.553 101.771 100.767 101.166C100.874 100.811 101.835 100.597 101.622 103.051C101.622 103.051 103.118 101.344 103.901 100.099C104.685 99.6725 106.68 100.633 107.071 101.309C106.608 102.518 106.216 104.154 105.575 105.008C104.899 105.861 103.794 106.502 103.331 106.573C102.868 106.644 102.192 107.675 102.192 107.675L99.2708 106.146Z"
        fill="#EC8B6C"
      />
      <Path
        d="M101.087 100.775V94.6572C101.087 94.337 101.372 94.0525 101.693 94.0525H105.896C106.217 94.0525 106.502 94.337 106.502 94.6572V102.802C106.502 103.123 106.217 103.407 105.896 103.407H101.693C101.372 103.407 101.087 103.123 101.087 102.802V100.775Z"
        fill="#4B4C61"
      />
      <Path
        d="M70.3479 134.494C70.3479 134.494 74.4797 137.233 81.4611 137.375C88.4425 137.518 92.2893 135.704 92.2893 135.704L91.9331 134.388C91.9331 134.388 80.0363 137.66 70.7041 133.178L70.3479 134.494Z"
        fill="#484858"
      />
      <Path
        d="M88.407 135.099L89.5468 134.885L89.9386 137.055L88.8344 137.269L88.407 135.099Z"
        fill="#5A5A6D"
      />
      <Path
        d="M79.9297 135.419H83.9903L83.9546 137.624H79.9297V135.419Z"
        fill="#5A5A6D"
      />
      <Path
        d="M74.8005 134.672L75.9047 134.921L75.4416 137.091L74.3374 136.842L74.8005 134.672Z"
        fill="#5A5A6D"
      />
      <Path
        d="M72.0934 118.382L73.162 110.77L72.8058 108.102C72.8058 108.102 75.0498 111.268 75.121 114.469C75.1922 117.67 71.9153 124.891 71.9153 124.891L72.0934 118.382Z"
        fill="#A1D4F3"
      />
      <Path
        d="M83.064 115.003C83.064 115.003 75.0853 122.828 73.1619 122.543C69.7781 122.045 66.6792 111.481 66.6792 111.481L73.1619 110.77L74.1592 116.461L81.3543 112.477L82.4941 111.695L84.4888 107.711H89.1549C89.1549 107.711 89.1549 108.814 87.4096 109.063C87.4096 109.063 87.7302 108.885 88.2644 110.343C88.9412 112.264 88.3713 111.801 87.4096 112.371C86.8041 112.726 85.878 113.509 85.0943 113.722C84.3463 113.9 83.064 115.003 83.064 115.003Z"
        fill="#EC8B6C"
      />
      <Path
        d="M105.54 100.811H101.978V96.2222H104.756L105.148 96.5779L105.54 96.898V100.811Z"
        fill="#434461"
      />
      <Path
        d="M105.754 100.562H102.192V95.9731H104.97L105.362 96.3288L105.754 96.6845V100.562Z"
        fill="white"
      />
      <Path
        d="M104.97 97.2893L102.94 97.2537C102.904 97.2537 102.833 97.2181 102.833 97.147C102.833 97.1114 102.868 97.0403 102.94 97.0403L104.934 97.0758C104.97 97.0758 105.041 97.1114 105.041 97.1826C105.041 97.2537 105.006 97.2893 104.97 97.2893Z"
        fill="#9BD2F2"
      />
      <Path
        d="M105.005 97.7873C105.005 97.8229 105.005 97.8229 105.005 97.7873L102.975 97.7517C102.939 97.7517 102.868 97.7162 102.868 97.645C102.868 97.6095 102.904 97.5383 102.975 97.5383L104.97 97.5739C105.005 97.5739 105.077 97.6095 105.077 97.6806C105.077 97.7517 105.041 97.7873 105.005 97.7873Z"
        fill="#F58882"
      />
      <Path
        d="M105.005 98.3208L102.975 98.2852C102.939 98.2852 102.868 98.2496 102.868 98.1785C102.868 98.1429 102.904 98.0718 102.975 98.0718L104.97 98.1073C105.005 98.1073 105.077 98.1429 105.077 98.2141C105.077 98.2852 105.041 98.3208 105.005 98.3208Z"
        fill="#9BD2F2"
      />
      <Path
        d="M103.973 99.1032C103.973 99.1388 103.937 99.1388 103.973 99.1032L103.011 99.0677C102.975 99.0677 102.904 99.0321 102.904 98.961C102.904 98.9254 102.94 98.8542 103.011 98.8542L103.973 98.8898C104.008 98.8898 104.079 98.9254 104.079 98.9965C104.044 99.0677 104.008 99.1032 103.973 99.1032Z"
        fill="#9BD2F2"
      />
      <Path
        d="M103.973 99.4946C103.973 99.4946 103.937 99.4946 103.973 99.4946L103.011 99.459C102.975 99.459 102.904 99.4235 102.904 99.3523C102.904 99.3167 102.94 99.2456 103.011 99.2456L103.973 99.2812C104.008 99.2812 104.079 99.3167 104.079 99.3879C104.044 99.4234 104.008 99.459 103.973 99.4946Z"
        fill="#9BD2F2"
      />
      <Path
        d="M104.97 95.9731V96.6845H105.754L104.97 95.9731Z"
        fill="#7ED3F7"
      />
    </G>
    <Defs>
      <LinearGradient
        id="paint0_linear"
        x1="122.578"
        y1="83.204"
        x2="112.762"
        y2="92.3502"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="7.7e-07" stopColor="#CCE2F5" />
        <Stop offset="1" stopColor="white" />
      </LinearGradient>
      <LinearGradient
        id="paint1_linear"
        x1="119.133"
        y1="82.4822"
        x2="107.231"
        y2="92.9893"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="7.7e-07" stopColor="#CCE2F5" />
        <Stop offset="1" stopColor="white" />
      </LinearGradient>
      <LinearGradient
        id="paint2_linear"
        x1="119.868"
        y1="78.0605"
        x2="109.939"
        y2="87.022"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="7.7e-07" stopColor="#CCE2F5" />
        <Stop offset="1" stopColor="white" />
      </LinearGradient>
      <LinearGradient
        id="paint3_linear"
        x1="66.2243"
        y1="117.896"
        x2="93.8136"
        y2="117.896"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="6.5e-07" stopColor="#B7DEFF" />
        <Stop offset="0.2112" stopColor="#BCE0FF" />
        <Stop offset="0.4748" stopColor="#CCE8FF" />
        <Stop offset="0.765" stopColor="#E5F3FF" />
        <Stop offset="1" stopColor="white" />
      </LinearGradient>
      <RadialGradient
        id="paint4_radial"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(82.6909 74.5899) rotate(-21.8043) scale(23.9297 23.9052)"
      >
        <Stop stopColor="#745166" />
        <Stop offset="1" stopColor="#575D74" />
      </RadialGradient>
      <ClipPath id="clip0">
        <Rect y="37" width="281" height="166" fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
));
