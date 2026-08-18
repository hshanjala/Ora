'use client'
// Patient photo that opens full-size on click. The 48px avatar is too small to
// recognise a face, so tapping it shows the stored image at full width.
import { useState } from 'react'
import {
  Avatar, Tooltip,
  Modal, ModalContent, ModalHeader, ModalBody,
} from '@/components/ui'

export default function PatientPhoto({ name, src, size = 'lg' }) {
  const [open, setOpen] = useState(false)

  // Nothing to enlarge when the avatar is just initials.
  if (!src) return <Avatar name={name} size={size} />

  return (
    <>
      <Tooltip label="View photo">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`View photo of ${name}`}
          className="shrink-0 rounded-full transition-opacity duration-fast ease-out hover:opacity-80"
        >
          <Avatar name={name} src={src} size={size} />
        </button>
      </Tooltip>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent size="md">
          <ModalHeader title={name} subtitle="Patient photo" />
          <ModalBody className="p-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Photo of ${name}`}
              className="max-h-photo w-full bg-surface-subtle object-contain"
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
