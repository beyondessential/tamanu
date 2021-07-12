import React, { useCallback } from 'react';

export const CheckArrayInput = ({
  options,
  field,
  ...props
}) => {
  const name = field.name;
  const currentList = (field ? field.value : props.value) || [];
  const onChange = field ? field.onChange : props.onChange;

  const toggle = React.useCallback(item => {
    if (currentList.includes(item)) {
      // set 
      const newList = currentList.filter(v => v != item);
      onChange({ target: { value: newList, name } });
    } else {
      // unset
      const newList = currentList.concat(item);
      onChange({ target: { value: newList, name } });
    }
  });

  return (
    <div>
      <div>
        { options.map(({ value, label }) =>
          <div 
            onClick={() => toggle(value)}
            key={value}
          >
            <span>{ label }</span>
            <span>{ currentList.includes(value) ? ' Y' : ' N' }</span>
          </div>
        ) }
      </div>
      <pre>{JSON.stringify({ currentList }, null, 2)}</pre>
    </div>
  );
};
