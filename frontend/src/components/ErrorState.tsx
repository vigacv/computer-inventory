import { Alert, Button } from '@mui/material'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

/** Inline error for a failed query, with an optional retry. */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Alert
      severity="error"
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        )
      }
    >
      {message}
    </Alert>
  )
}
