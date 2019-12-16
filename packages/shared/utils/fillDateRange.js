import moment from 'moment';

export function fillDateRange(start, end, interval) {
  // if start/end are strings, this will turn them into malleable dates,
  // if they're moment objects it'll clone them
  const endDate = moment(end);
  const ranges = [];

  let date = moment(start);
  while (date < endDate) {
    ranges.push(date);
    date = moment(date).add(1, interval);
  }

  return ranges;
}
