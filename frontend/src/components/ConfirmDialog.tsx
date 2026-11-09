import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useId } from 'react'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  /** Styles the confirm button as destructive. */
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** In-app confirmation (rather than the browser's confirm(), which blocks the page and can't be styled). */
export function ConfirmDialog({ title, message, confirmLabel, destructive, busy, onConfirm, onCancel }: ConfirmDialogProps) {
  const titleId = useId()
  const messageId = useId()

  return (
    <Dialog
      open
      onClose={() => !busy && onCancel()}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id={messageId}>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {/* Cancel gets focus first, so pressing Enter by reflex doesn't delete anything. */}
        <Button onClick={onCancel} disabled={busy} autoFocus>
          Cancel
        </Button>
        <Button variant="contained" color={destructive ? 'error' : 'primary'} onClick={onConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
