import React from 'react';
import Svg, {
  SvgProps,
  Rect,
  Defs,
  Pattern,
  Use,
  Image,
  G,
} from 'react-native-svg';

export const Avatar_11 = React.memo((props: SvgProps) => {
  return (
    <Svg width="32" height="32" viewBox="0 0 32 32" fill="none" {...props}>
      <Rect width="32" height="32" rx="16" fill="url(#pattern0)" />
      <Defs>
        <Pattern
          id="pattern0"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1">
          <Use xlinkHref="#image0" transform="scale(0.005)" />
        </Pattern>
        <G id="image0">
          <Image
            width="200"
            height="200"
            xlinkHref={{
              uri:
                'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA8AAD/4QMxaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzE0NSA3OS4xNjM0OTksIDIwMTgvMDgvMTMtMTY6NDA6MjIgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChNYWNpbnRvc2gpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjU3NUFEMkI0MTYyOTExRTk4M0MzQUIwNjRCNjU5NTgwIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjU3NUFEMkI1MTYyOTExRTk4M0MzQUIwNjRCNjU5NTgwIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NTc1QUQyQjIxNjI5MTFFOTgzQzNBQjA2NEI2NTk1ODAiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NTc1QUQyQjMxNjI5MTFFOTgzQzNBQjA2NEI2NTk1ODAiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAGBAQEBQQGBQUGCQYF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',
            }}
          />
        </G>
      </Defs>
    </Svg>
  );
});
