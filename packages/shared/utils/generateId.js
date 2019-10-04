const generators = {
  A: () => String.fromCharCode(65 + Math.floor(Math.random() * 26)),
  '0': () => Math.floor(Math.random() * 10).toFixed(0),
};

function createIdGenerator(format) {
  const generatorPattern = Array.from(format).map(char => generators[char] || (() => ''));

  return () => generatorPattern.map(generator => generator()).join('');
}

export const generateId = createIdGenerator('AAAA000000');
