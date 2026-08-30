import { useState } from 'react'
import { Pin, Plus, Trash2 } from 'lucide-react'
import { db } from '../db/db'
import type { Note } from '../db/types'
import { useNotes } from '../lib/hooks'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'

const NOTE_COLORS = ['#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#ede9fe', '#f1f5f9']

export function Notes() {
  const notes = useNotes()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState(NOTE_COLORS[0])

  const openEditor = (note?: Note) => {
    setEditing(note ?? null)
    setTitle(note?.title ?? '')
    setContent(note?.content ?? '')
    setColor(note?.color ?? NOTE_COLORS[0])
    setOpen(true)
  }

  const save = async () => {
    if (!title && !content) return
    const payload = {
      title: title || 'Untitled',
      content,
      color,
      updatedAt: Date.now(),
    }
    if (editing?.id) await db.notes.update(editing.id, payload)
    else await db.notes.add({ ...payload, createdAt: Date.now() })
    setOpen(false)
  }

  const sorted = [...notes].sort(
    (a, b) => Number(!!b.pinned) - Number(!!a.pinned),
  )

  return (
    <div>
      <PageHeader
        title="Notes"
        subtitle="Family finance notes & reminders"
        action={
          <Button size="sm" onClick={() => openEditor()}>
            <Plus size={18} /> New note
          </Button>
        }
      />

      {sorted.length ? (
        <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
          {sorted.map((n) => (
            <Card
              key={n.id}
              interactive
              onClick={() => openEditor(n)}
              className="mb-3 break-inside-avoid"
              style={{ background: n.color }}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <p className="font-bold text-slate-900">{n.title}</p>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      n.id && db.notes.update(n.id, { pinned: !n.pinned })
                    }}
                    className={cn(
                      'text-slate-500',
                      n.pinned && 'text-[var(--color-primary)]',
                    )}
                  >
                    <Pin size={15} fill={n.pinned ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      n.id && db.notes.delete(n.id)
                    }}
                    className="text-slate-500 hover:text-[var(--color-danger)]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {n.content}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon="NotebookPen"
            title="No notes yet"
            subtitle="Jot down budgets, reminders, or shopping ideas."
            action={
              <Button size="sm" onClick={() => openEditor()}>
                <Plus size={18} /> New note
              </Button>
            }
          />
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit note' : 'New note'}>
        <div className="space-y-4">
          <Field label="Title">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
            />
          </Field>
          <Field label="Content">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write something…"
              className="min-h-40"
            />
          </Field>
          <Field label="Color">
            <div className="flex gap-2">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-8 w-8 rounded-full border border-black/10',
                    color === c && 'ring-2 ring-[var(--color-primary)] ring-offset-2',
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </Field>
          <Button className="w-full" onClick={save}>
            Save note
          </Button>
        </div>
      </Modal>
    </div>
  )
}
