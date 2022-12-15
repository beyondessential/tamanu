import { capitaliseFirstLetter } from './capitalise';

function parseNumericAnswer(answer) {
  const value = parseFloat(answer);
  if (isNaN(value)) return null;
  return value;
}

function getVitalsCellTooltip(value, validationCriteria, config) {
  const { unit = '', rounding = 0 } = config || {};
  const { normalRange } = validationCriteria || {};
  const isWithinRange = !normalRange || (value <= normalRange.max && value >= normalRange.min);
  if (isWithinRange) {
    if (!unit || unit.length <= 2) return null;
    // Show tooltip to show full value and unit
    const fixedVal = value.toFixed(rounding);
    return {
      tooltip: `${fixedVal}${unit}`,
      severity: 'info',
    };
  }
  // Show Outside range tooltip
  let tooltip = `Outside normal range\n`;

  if (value < normalRange.min) {
    tooltip += `<${normalRange.min}${unit}`;
  } else if (value > normalRange.max) {
    tooltip += `>${normalRange.max}${unit}`;
  }

  return {
    tooltip,
    severity: 'alert',
  };
}

export function getVitalsCellConfig(answer, validationCriteria, config) {
  const { rounding = 0, accessor, unit } = config || {};
  let value = answer;
  let tooltipConfig = null;
  const float = parseNumericAnswer(answer);
  if (float === null) {
    // Non-numeric value
    if (typeof accessor === 'function') {
      value = accessor({ amount: answer });
    } else {
      value = answer ? capitaliseFirstLetter(answer) : '-';
    }
  } else {
    // Numeric value
    tooltipConfig = getVitalsCellTooltip(float, validationCriteria, config);
    const showUnit = unit && unit.length <= 2;
    value = `${float.toFixed(rounding)}${showUnit ? unit : ''}`;
  }
  return { value, ...tooltipConfig };
}

export function getMeasureCellConfig(value, validationCriteria, config) {
  const { unit } = config || {};
  const { normalRange } = validationCriteria || {};
  const tooltip =
    normalRange && `Normal range ${normalRange.min}${unit} - ${normalRange.max}${unit}`;
  return {
    value,
    tooltip,
    severity: 'info',
  };
}
