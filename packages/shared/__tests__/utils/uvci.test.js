import { expect } from 'chai';
import { generateICAOFormatUVCI } from '../../src/utils/uvci/icao';
import { generateEUDCCFormatUVCI } from '../../src/utils/uvci/eudcc';

describe('UVCI generation', () => {
  describe('Generate ICAO UVCI', () => {
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
  describe('Generate EU DCC UVCI', () => {
    // Arrange
    const uuid = 'e7664992-13c4-42c8-a106-b31f4f825466';

    // Act
    const hash1 = generateEUDCCFormatUVCI(uuid, 'UT');
    const hash2 = generateEUDCCFormatUVCI(uuid, 'DL');

    it('Should generate a checksummed UVCI', () => {
      // Assert
      expect(hash1.length).to.equal(49);
      // The final checksum should only consider the uuid so they should be the same
      expect(hash1.substr(-1)).to.equal(hash2.substr(-1));
    });
  });
});
