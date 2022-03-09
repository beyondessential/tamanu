import { expect } from 'chai';
import { generateICAOFormatUVCI } from '../../src/utils/uvci/icao';

describe('Generate UUID Hash', () => {
  // Arrange
  const uuid = 'e7664992-13c4-42c8-a106-b31f4f825466';
  const lowUuid = '10101010-0000-0000-0000-000000000000';
  const highUuid = 'fffffff-eeee-cccc-cccc-aaaaaaaaaaaa';

  // Act
  const hash1 = generateICAOFormatUVCI(uuid);
  const hash2 = generateICAOFormatUVCI(lowUuid);
  const hash3 = generateICAOFormatUVCI(highUuid);

  it('Should generate a 12 digit hash', () => {
    // Assert
    expect(hash1.length).to.equal(12);
    expect(hash2.length).to.equal(12);
    expect(hash3.length).to.equal(12);
  });
});
