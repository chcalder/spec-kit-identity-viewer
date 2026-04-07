import { useState } from 'react'
import { type IdTokenClaims } from '@azure/msal-browser'
import { AppRole } from '../roles'
import { hasRole } from '../utils/securityUtils'
import { maskAccountNumber } from '../utils/mask'
import { auditExportAttempt } from '../services/auditService'
import { type FinancialRecord } from '../types/financial'

interface Props {
  claims: IdTokenClaims
}

export default function FinancialExportCard({ claims }: Props) {
  const [isExporting, setIsExporting] = useState(false)
  const [record, setRecord] = useState<{ maskedAccountNumber: string; balance: number; transactionDate: string } | null>(null)

  const upn = (claims.preferred_username as string | undefined) ?? (claims.upn as string | undefined) ?? 'unknown'

  const handleExport = async () => {
    // Invocation gate — FSC-EXPORT-001
    if (!hasRole(claims, AppRole.FinancialAuditor)) {
      await auditExportAttempt(upn, 'denied')
      return
    }

    setIsExporting(true)

    // Audit before action — FSC-EXPORT-003
    await auditExportAttempt(upn, 'granted')

    // Mock financial record — FSC-EXPORT-002: mask before storing in state
    const raw: FinancialRecord = {
      accountNumber: '00012345678',
      balance: 98432.50,
      transactionDate: new Date().toISOString(),
    }

    setRecord({
      maskedAccountNumber: maskAccountNumber(raw.accountNumber),
      balance: raw.balance,
      transactionDate: raw.transactionDate,
    })

    setIsExporting(false)
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Financial Export
      </h3>

      <button
        onClick={handleExport}
        disabled={isExporting}
        className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors mb-4"
      >
        {isExporting ? 'Exporting...' : 'Export Financial Data'}
      </button>

      {record && (
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-400">Account Number</dt>
            <dd className="text-white font-mono">{record.maskedAccountNumber}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">Balance</dt>
            <dd className="text-white">{record.balance.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">Transaction Date</dt>
            <dd className="text-white">{record.transactionDate}</dd>
          </div>
        </dl>
      )}
    </div>
  )
}
