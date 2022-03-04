import { expect } from 'chai';
import { generateUUIDDateTimeHash } from '../../src/utils';

describe('Generate UUID Date Time Hash', () => {
  // Arrange
  const uuid = 'e7664992-13c4-42c8-a106-b31f4f825466';
  const lowUuid = '10101010-0000-0000-0000-000000000000';

  const date = new Date(Date.parse('21 February 2022, UTC'));
  const oldDate = new Date(Date.parse('2 January 1970, UTC'));

  // Act
  const hash1 = generateUUIDDateTimeHash(uuid, date);
  const hash2 = generateUUIDDateTimeHash(lowUuid, date);
  const hash3 = generateUUIDDateTimeHash(uuid, oldDate);

  it('Should generate a 12 digit has', () => {
    // Assert
    expect(hash1.length).to.equal(12);
    expect(hash2.length).to.equal(12);
    expect(hash3.length).to.equal(12);
  });

  it('Should contain a predictable time', () => {
    // reverse the hashing
    const timeSegment1 = hash1.slice(6, 12);
    const timeSegment2 = hash2.slice(6, 12);
    const timeSegment3 = hash3.slice(6, 12);

    const hashTime1 = parseInt(timeSegment1, 36) * 1000;
    const hashTime2 = parseInt(timeSegment2, 36) * 1000;
    const hashTime3 = parseInt(timeSegment3, 36) * 1000;

    // Assert
    expect(hashTime1).to.equal(date.getTime());
    expect(hashTime2).to.equal(date.getTime());
    expect(hashTime3).to.equal(oldDate.getTime());
  });

  it('Should contain a predictable segment of a uuid', () => {
    // reverse the hashing
    const uuidSegmentHash1 = hash1.slice(0, 6);
    const uuidSegmentHash2 = hash2.slice(0, 6);
    const uuidSegmentHash3 = hash3.slice(0, 6);

    const uuidNumber1 = parseInt(uuidSegmentHash1, 36);
    const uuidNumber2 = parseInt(uuidSegmentHash2, 36);
    const uuidNumber3 = parseInt(uuidSegmentHash3, 36);

    const uuidSegment1 = uuidNumber1.toString(16);
    const uuidSegment2 = uuidNumber2.toString(16);
    const uuidSegment3 = uuidNumber3.toString(16);

    // Assert
    expect(uuidSegment1).to.equal(uuid.slice(0, 7));
    expect(uuidSegment2).to.equal(lowUuid.slice(0, 7));
    expect(uuidSegment3).to.equal(uuid.slice(0, 7));
  });
});
