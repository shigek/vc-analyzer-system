export function searchBit(bitstring: Buffer, index: number, bits: number) {
  const byteIndex = Math.ceil(index / 8);
  const bitIndex = index & 7;
  const byte = (bitstring[byteIndex] >> bitIndex) & ((1 << bits) - 1);
  return byte;
}
export function replaceBit(
  bitstring: Buffer,
  index: number,
  bits: number,
  newbit: number,
) {
  const byteIndex = Math.ceil(index / 8);
  const bitIndex = index & 7;
  let byte = bitstring[byteIndex];
  if (2 ** bits - 1 < newbit) {
    throw new Error(`Replace bit pattern is out of range: max(${2 ** bits})`);
  }
  return {
    byte: (byte & ~((2 ** bits - 1) << bitIndex)) | (newbit << bitIndex),
    byteIndex,
  };
}
export function isBeforeDay(day: Date) {
  const now = new Date(); // 現在の日時を取得
  const validUntilDate = new Date(day);
  const isFuture = validUntilDate.getTime() < now.getTime();
  return isFuture;
}
export function isAfterDay(day: Date) {
  const now = new Date(); // 現在の日時を取得
  const validUntilDate = new Date(day);
  const isFuture = validUntilDate.getTime() > now.getTime();
  return isFuture;
}
export function addYear(day: Date, years: number) {
  const newDate = new Date(day);
  newDate.setFullYear(newDate.getFullYear() + years);
  return newDate;
}
