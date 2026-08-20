import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TabBar } from '../components/TabBar'
import { BlockCard, type BlockWithJoins } from '../components/BlockCard'
import { AddSheet } from '../components/AddSheet'
import { FileToPageSheet } from '../components/FileToPageSheet'
import { EditPhotoSheet } from '../components/EditPhotoSheet'
import { PlusIcon } from '../components/icons'

export function LoosePile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [blocks, setBlocks] = useState<BlockWithJoins[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [fileTarget, setFileTarget] = useState<BlockWithJoins | null>(null)
  const [editingPhoto, setEditingPhoto] = useState<BlockWithJoins | null>(null)

  async function load() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('blocks')
      .select('*, place:places(name), movie:movies(title, poster_path)')
      .eq('user_id', user.id)
      .is('page_id', null)
      .order('captured_at', { ascending: false })
    setBlocks((data ?? []) as unknown as BlockWithJoins[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const initial = (user?.email ?? '?')[0]?.toUpperCase()

  return (
    <div className="screen">
      <div className="header scalloped">
        <h1>Loose Pile</h1>
        <div className="sub">
          {loading ? 'loading…' : `${blocks.length} moment${blocks.length === 1 ? '' : 's'} waiting to be paged`}
        </div>
        <div className="avatar">{initial}</div>
      </div>

      <div className="pile">
        {!loading && blocks.length === 0 && (
          <div className="empty-state">Nothing in the pile yet — tap + to capture a moment.</div>
        )}
        {blocks.map((b) => (
          <BlockCard
            key={b.id}
            block={b}
            onClick={() => setFileTarget(b)}
            onEdit={b.type === 'photo' ? () => setEditingPhoto(b) : undefined}
          />
        ))}
      </div>

      <button className="fab" onClick={() => setAddOpen(true)} aria-label="Add a moment">
        <PlusIcon />
      </button>

      {addOpen && (
        <AddSheet
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            setAddOpen(false)
            load()
          }}
        />
      )}

      {fileTarget && (
        <FileToPageSheet
          block={fileTarget}
          onClose={() => setFileTarget(null)}
          onFiled={(pageDate) => {
            setFileTarget(null)
            load()
            navigate(`/day/${pageDate}`)
          }}
        />
      )}

      {editingPhoto && (
        <EditPhotoSheet
          block={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onSaved={() => { setEditingPhoto(null); load() }}
          onDeleted={() => { setEditingPhoto(null); load() }}
        />
      )}

      <TabBar active="today" />
    </div>
  )
}
