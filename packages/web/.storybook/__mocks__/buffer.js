module.exports = class Buffer {
  static isBuffer(){
    return true;
  }
  static from(){
    return {
      toString: () => 'test'
    }
  }
}
