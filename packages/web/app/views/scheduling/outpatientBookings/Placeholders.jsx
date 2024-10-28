import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Colors } from '../../../constants/index';
import { CELL_WIDTH_PX, ColumnWrapper, HeadCell } from './OutpatientBookingCalender';

const Skeleton = styled.div`
  background-color: ${Colors.background};
  flex: 1;
  display: flex;
  overflow: hidden;
`;

export const Placeholders = () => {
  const [availableColumns, setAvailableColumn] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const current = ref.current;
    if (!current) return;
    const observer = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setAvailableColumn(Math.ceil(width / CELL_WIDTH_PX));
    });
    observer.observe(ref.current);
    return () => current && observer.unobserve(current);
  }, [ref]);
  return (
    <Skeleton ref={ref}>
      {Array.from({ length: availableColumns }).map((_, i) => (
        <ColumnWrapper key={`skeleton-${i}`}>
          <HeadCell />
        </ColumnWrapper>
      ))}
    </Skeleton>
  );
};
