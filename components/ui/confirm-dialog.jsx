'use client'
import { Modal, ModalContent, ModalHeader, ModalFooter } from './modal'
import { Button } from './button'

/**
 * Destructive actions are always confirmed, always `danger`.
 *
 * <ConfirmDialog
 *   open={open} onOpenChange={setOpen}
 *   title="Delete this expense?"
 *   description="This can't be undone."
 *   confirmLabel="Delete"
 *   onConfirm={handleDelete}
 *   loading={deleting}
 * />
 */
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  loading = false,
  onConfirm,
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalHeader title={title} subtitle={description} hideClose />
        <ModalFooter className="border-t-0 pt-1">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export { ConfirmDialog }
