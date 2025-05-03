export function searchBit(bitstring: Buffer, index: number) {
  const byteIndex = Math.ceil(index / 8);
  const bitIndex = index & 7;
  return (bitstring[byteIndex] >> bitIndex) & 1;
}
export function replaceBit(bitstring: Buffer, index: number, revoked: number) {
  const byteIndex = Math.ceil(index / 8);
  const bitIndex = index & 7;
  let byte = bitstring[byteIndex];
  return revoked === 0
    ? { byte: byte | (1 << bitIndex), byteIndex }
    : { byte: byte | ~(1 << bitIndex), byteIndex };
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
