function searchBit(bitstring: Buffer, index: number, bits: number) {
  const byteIndex = Math.ceil(index / 8);
  const bitIndex = index & 7;
  const byte = (bitstring[byteIndex] >> bitIndex) & ((1 << bits) - 1);
  return byte;
}

function replaceBit(bitstring: Buffer, index: number, bits: number, newbit: number) {
  const byteIndex = Math.ceil(index / 8);
  const bitIndex = index & 7;
  let byte = bitstring[byteIndex];
  if ((2 ** bits - 1) < newbit) {
    throw new Error(`Replace bit pattern is out of range`)
  }
  return { byte: (byte & ~((2 ** bits - 1) << bitIndex)) | (newbit << bitIndex), byteIndex };
}

const byteLength = Math.ceil(1000 / 8);
const bitstringBuffer = Buffer.alloc(byteLength);

const { byte, byteIndex } = replaceBit(bitstringBuffer, 0, 2, 3);
bitstringBuffer[byteIndex] = byte;
console.log("size=2 =", searchBit(bitstringBuffer, 0, 2));

// const { byte, byteIndex } = replaceBit(bitstringBuffer, 0, 1, 1);
// bitstringBuffer[byteIndex] = byte;
// console.log("size=1 =", searchBit(bitstringBuffer, 0, 1));
