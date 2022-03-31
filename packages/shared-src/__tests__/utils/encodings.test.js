import { expect } from 'chai';
import { pem, depem } from '../../src/utils/encodings';

describe('PEM', () => {
  it('should round-trip data through pem and depem', () => {
    // Arrange
    const data = Buffer.from('Hello World');

    // Act
    const pemd = pem(data, 'TEST');
    const depemd = depem(pemd, 'TEST');

    // Assert
    expect(depemd).to.equal(data);
    expect(pemd).to.equal('Hello World');
  });

  it('should depem documents with Unix line endings', () => {
    // Arrange
    const word = Buffer.from('Hello World').toString('base64');
    const data = `-----BEGIN TEST-----\n${word}\n-----END TEST-----\n\n`;

    // Act
    const depemd = depem(data, 'TEST');

    // Assert
    expect(depemd).to.equal('Hello World');
  });

  it('should depem documents with Windows line endings', () => {
    // Arrange
    const word = Buffer.from('Hello World').toString('base64');
    const data = `-----BEGIN TEST-----\r\n${word}\r\n-----END TEST-----\r\n\r\n`;

    // Act
    const depemd = depem(data, 'TEST');

    // Assert
    expect(depemd).to.equal('Hello World');
  });

  it('should depem documents with cursed line endings', () => {
    // Arrange
    const word = Buffer.from('Hello World').toString('base64');
    const data = `-----BEGIN TEST-----\n${word}\r\n-----END TEST-----\r\n\n`;

    // Act
    const depemd = depem(data, 'TEST');

    // Assert
    expect(depemd).to.equal('Hello World');
  });
});
