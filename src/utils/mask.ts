// maskAccountNumber — PII masking for financial account numbers (FSC-EXPORT-002)
// Returns last 4 digits visible: e.g. '00012345678' → '****5678'
// Returns '****' if the value has fewer than 4 digits
export function maskAccountNumber(value: string): string {
  const match = value.match(/(\d{4})$/)
  if (!match) return '****'
  return `****${match[1]}`
}
