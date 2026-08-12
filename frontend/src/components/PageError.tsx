import { AlertCircle } from 'lucide-react'

export function PageError({ message }: { message: string }) {
  if (!message) {
    return null
  }
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
