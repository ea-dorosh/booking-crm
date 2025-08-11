import { phone } from 'phone';

function formatName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function formatPhone(phoneNumber: string): string | null {
  const deResult = phone(phoneNumber, { country: `DE` });
  return deResult.isValid ? deResult.phoneNumber : phone(phoneNumber).phoneNumber;
}

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ``)
    .trim()
    .replace(/\s+/g, `-`);
}

function parseNumberWithComma(value: string): number {
  const normalizedValue = value.replace(`,`, `.`);
  return parseFloat(normalizedValue);
}

export {
  formatName,
  formatPhone,
  toKebabCase,
  parseNumberWithComma,
};
