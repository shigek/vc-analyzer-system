const Bit1 = {
  revocation: {
    '0x0': 'valid',
    '0x1': 'revoked',
  },
  suspension: {
    '0x0': 'valid',
    '0x1': 'revoked',
  },
};
const Bit2 = {
  message: {
    '0x0': 'valid',
    '0x1': 'revoked',
    '0x2': 'suspended',
    '0x3': 'unknown',
  },
};
const Bit3 = {
  message: {},
};
const Bit4 = {
  message: {},
};
const get = {
  '1': Bit1,
  '2': Bit2,
  '3': Bit3,
  '4': Bit4,
};
export function getMapping(statusPurpose: string, bits: number) {
  try {
    const step1 = get[bits.toString()];
    return step1[statusPurpose];
  } catch (error) {
    console.error('bitMapping get faild', error);
  }
}
export function getCodetoName(
  code: number,
  bitMapping: { [index: string]: string },
) {
  return bitMapping[`0x${code.toString()}`];
}
export function getNametoCode(
  name: string,
  bitMapping: { [index: string]: string },
) {
  const key = Object.keys(bitMapping).find((key) => bitMapping[key] === name);
  return key ? key.replace('0x', '') : key;
}
