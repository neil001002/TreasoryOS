import { ExternalLink, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { buildTxUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface TxStatusProps {
  isPending?: boolean
  isConfirming?: boolean
  isSuccess?: boolean
  isError?: boolean
  errorMessage?: string
  hash?: `0x${string}`
  className?: string
}

export function TxStatus({
  isPending,
  isConfirming,
  isSuccess,
  isError,
  errorMessage,
  hash,
  className,
}: TxStatusProps) {
  if (!isPending && !isConfirming && !isSuccess && !isError) return null

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border text-sm',
        isSuccess && 'bg-green-50 border-green-200 text-green-800',
        isError && 'bg-red-50 border-red-200 text-red-800',
        (isPending || isConfirming) && 'bg-blue-50 border-blue-200 text-blue-800',
        className,
      )}
    >
      {isSuccess && <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />}
      {isError && <XCircle size={18} className="mt-0.5 shrink-0 text-red-600" />}
      {(isPending || isConfirming) && <Loader2 size={18} className="mt-0.5 shrink-0 animate-spin" />}

      <div className="flex-1 min-w-0">
        {isPending && <p className="font-medium">Confirm in wallet...</p>}
        {isConfirming && <p className="font-medium">Waiting for confirmation...</p>}
        {isSuccess && <p className="font-medium">Transaction confirmed!</p>}
        {isError && (
          <p className="font-medium">
            {errorMessage ?? 'Transaction failed. Please try again.'}
          </p>
        )}
        {hash && (
          <a
            href={buildTxUrl(hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1 text-xs underline opacity-70 hover:opacity-100 mono"
          >
            {hash.slice(0, 10)}...{hash.slice(-6)}
            <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  )
}
