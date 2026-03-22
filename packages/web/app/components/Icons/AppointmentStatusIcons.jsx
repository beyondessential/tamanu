import React from 'react';
import { Svg } from './Svg';

export const CheckIconFilled = ({
  htmlColor = 'currentcolor',
  width = 24,
  height = 24,
  ...props
}) => (
  <Svg width={width} height={height} {...props} data-testid="svg-w2ve">
    <path
      d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
      fill="white"
    />
    <path
      d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM17.5833 9.25L10.9167 15.9167C10.75 16.0833 10.5833 16.1667 10.3333 16.1667C10.0833 16.1667 9.91667 16.0833 9.75 15.9167L6.41667 12.5833C6.08333 12.25 6.08333 11.75 6.41667 11.4167C6.75 11.0833 7.25 11.0833 7.58333 11.4167L10.3333 14.1667L16.4167 8.08333C16.75 7.75 17.25 7.75 17.5833 8.08333C17.9167 8.41667 17.9167 8.91667 17.5833 9.25Z"
      fill={htmlColor}
    />
  </Svg>
);

export const CheckIconOutlined = ({
  htmlColor = 'currentcolor',
  width = 24,
  height = 24,
  ...props
}) => (
  <Svg width={width} height={height} {...props} data-testid="svg-zwwq">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 12C2 6.5 6.5 2 12 2C17.5 2 22 6.5 22 12C22 17.5 17.5 22 12 22C6.5 22 2 17.5 2 12ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM10.9167 15.9167L17.5833 9.25C17.9167 8.91667 17.9167 8.41667 17.5833 8.08333C17.25 7.75 16.75 7.75 16.4167 8.08333L10.3333 14.1667L7.58333 11.4167C7.25 11.0833 6.75 11.0833 6.41667 11.4167C6.08333 11.75 6.08333 12.25 6.41667 12.5833L9.75 15.9167C9.91667 16.0833 10.0833 16.1667 10.3333 16.1667C10.5833 16.1667 10.75 16.0833 10.9167 15.9167Z"
      fill={htmlColor}
    />
    <circle cx={12} cy={12} r={9} stroke={htmlColor} strokeWidth={2} />
  </Svg>
);

export const CircleIconDashed = ({
  htmlColor = 'currentcolor',
  width = 24,
  height = 24,
  ...props
}) => (
  <Svg width={width} height={height} {...props} data-testid="svg-ofal">
    <circle cx={12} cy={12} r={9} stroke={htmlColor} strokeWidth={2} strokeDasharray="4 4" />
  </Svg>
);

export const CircleIconOutlined = ({
  htmlColor = 'currentcolor',
  width = 24,
  height = 24,
  ...props
}) => (
  <Svg width={width} height={height} {...props} data-testid="svg-5vtx">
    <circle cx={12} cy={12} r={9} stroke={htmlColor} />
  </Svg>
);

export const CrossIconFilled = ({
  htmlColor = 'currentcolor',
  width = 24,
  height = 24,
  ...props
}) => (
  <Svg width={width} height={height} {...props} data-testid="svg-0vac">
    <circle cx={12} cy={12} r={9} fill={htmlColor} />
    <path
      d="M15.5355 14.6517L12.8839 12L15.5355 9.34835C15.8007 9.08318 15.8007 8.72963 15.5355 8.46447C15.2704 8.1993 14.9168 8.1993 14.6517 8.46447L12 11.1161L9.34835 8.46447C9.08318 8.1993 8.72963 8.1993 8.46447 8.46447C8.1993 8.72963 8.1993 9.08318 8.46447 9.34835L11.1161 12L8.46447 14.6517C8.1993 14.9168 8.1993 15.2704 8.46447 15.5355C8.72963 15.8007 9.08318 15.8007 9.34835 15.5355L12 12.8839L14.6517 15.5355C14.9168 15.8007 15.2704 15.8007 15.5355 15.5355C15.8007 15.2704 15.8007 14.9168 15.5355 14.6517Z"
      fill="white"
    />
  </Svg>
);
