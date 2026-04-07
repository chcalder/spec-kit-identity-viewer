// Single source of truth for App Role values (FSC-EXPORT-001)
// The string 'Financial.Auditor' must only appear in this file — verify with:
// grep -rn "Financial.Auditor" src/ --include="*.ts" --include="*.tsx"
export const AppRole = {
  FinancialAuditor: 'Financial.Auditor',
} as const
