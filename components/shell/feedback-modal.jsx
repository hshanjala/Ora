'use client'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, X } from 'lucide-react'
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, FormField, Textarea, Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem, Alert, useToast,
} from '@/components/ui'

const CATEGORIES = [
  { value: 'bug', label: 'Bug / Something broken' },
  { value: 'feature', label: 'Feature request' },
  { value: 'general', label: 'General feedback' },
]

export default function FeedbackModal({ open, onOpenChange }) {
  const supabase = createClient()
  const toast = useToast()
  const fileRef = useRef(null)
  const [category, setCategory] = useState('bug')
  const [description, setDescription] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [preview, setPreview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Screenshot must be under 5 MB')
      return
    }
    setScreenshot(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  function removeScreenshot() {
    setScreenshot(null)
    setPreview('')
    if (fileRef.current) fileRef.current.value = ''
  }

  function resetForm() {
    setCategory('bug')
    setDescription('')
    setScreenshot(null)
    setPreview('')
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!description.trim()) return
    setSubmitting(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated. Please refresh and try again.')
      setSubmitting(false)
      return
    }

    let screenshotUrl = null
    if (screenshot) {
      const ext = screenshot.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('patient-images')
        .upload(path, screenshot, { upsert: true })
      if (upErr) {
        setError(`Screenshot upload failed: ${upErr.message}`)
        setSubmitting(false)
        return
      }
      screenshotUrl = supabase.storage.from('patient-images').getPublicUrl(path).data.publicUrl
    }

    const { error: insertErr } = await supabase.from('feedback').insert({
      clinic_id: user.id,
      email: user.email,
      category,
      description: description.trim(),
      screenshot_url: screenshotUrl,
    })

    setSubmitting(false)
    if (insertErr) {
      setError(`Failed to submit: ${insertErr.message}`)
      return
    }

    toast.success('Feedback submitted', 'Thank you! We\'ll look into it.')
    resetForm()
    onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v) }}>
      <ModalContent size="sm">
        <ModalHeader
          title="Report a Problem"
          subtitle="Tell us what's wrong or what you'd like to see"
        />
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            {error && <Alert status="danger">{error}</Alert>}

            <FormField label="Category">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Description" required>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened or what you'd like…"
                rows={4}
                required
              />
            </FormField>

            <div>
              <p className="mb-1.5 text-label text-secondary">Screenshot (optional)</p>
              {preview ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Screenshot preview"
                    className="h-24 rounded-md border object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeScreenshot}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-inverse"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 rounded-md border border-dashed border-strong px-3 py-2 text-small text-tertiary transition-colors duration-fast hover:bg-surface-hover"
                >
                  <ImagePlus size={16} strokeWidth={1.75} />
                  Attach screenshot
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => { resetForm(); onOpenChange(false) }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={!description.trim()}
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
