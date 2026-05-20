import Underline from '@tiptap/extension-underline';
import React, { useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { FileUp, Save, Share2, Plus, RefreshCw } from 'lucide-react';
import { EditorToolbar } from './components/EditorToolbar';
import { USERS } from './lib/users';
import { supportsImportFile, validateDocumentTitle } from './lib/validation';
import { createDocument, listDocumentsForUser, shareDocument, updateDocument } from './lib/documentService';
import { supabaseConfigured } from './lib/supabase';
import './styles.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(USERS[0]);
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [shareUserId, setShareUserId] = useState(USERS[1].id);

  const canEdit = activeDoc?.accessType === 'owned';

  const editor = useEditor({
    extensions: [
  StarterKit,
  Underline,
],
    content: activeDoc?.content || '<p>Select or create a document.</p>',
    editable: Boolean(activeDoc),
    editorProps: {
      attributes: { class: 'prose min-h-[430px] max-w-none p-6 focus:outline-none' }
    }
  });

  useEffect(() => {
    if (editor && activeDoc) {
      editor.commands.setContent(activeDoc.content || '<p></p>');
      editor.setEditable(Boolean(activeDoc));
      setTitle(activeDoc.title || '');
    }
  }, [activeDoc, editor]);

  async function refreshDocs(user = currentUser) {
    try {
      setError('');
      setStatus('Loading documents...');
      const docs = await listDocumentsForUser(user.id);
      setDocuments(docs);
      setActiveDoc((current) => docs.find((doc) => doc.id === current?.id) || docs[0] || null);
      setStatus('Documents loaded.');
    } catch (err) {
      setError(err.message);
      setStatus('');
    }
  }

  useEffect(() => {
    if (supabaseConfigured) refreshDocs(currentUser);
  }, [currentUser.id]);

  async function handleCreate() {
    try {
      setError('');
      const doc = await createDocument({ title: 'Untitled document', ownerId: currentUser.id });
      setDocuments((prev) => [doc, ...prev]);
      setActiveDoc(doc);
      setStatus('New document created.');
    } catch (err) { setError(err.message); }
  }

  async function handleSave() {
    if (!activeDoc) return;
    const validationError = validateDocumentTitle(title);
    if (validationError) return setError(validationError);
    try {
      setError('');
      const saved = await updateDocument({ id: activeDoc.id, title, content: editor.getHTML() });
      const updated = { ...activeDoc, ...saved };
      setActiveDoc(updated);
      setDocuments((prev) => prev.map((doc) => doc.id === updated.id ? updated : doc));
      setStatus('Saved successfully.');
    } catch (err) { setError(err.message); }
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!supportsImportFile(file)) return setError('Only .txt and .md imports are supported in this MVP.');
    const text = await file.text();
    try {
      const html = `<p>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '</p><p>')}</p>`;
      const doc = await createDocument({ title: file.name.replace(/\.(txt|md)$/i, ''), ownerId: currentUser.id, content: html });
      setDocuments((prev) => [doc, ...prev]);
      setActiveDoc(doc);
      setStatus('File imported as editable document.');
    } catch (err) { setError(err.message); }
  }

  async function handleShare() {
    if (!activeDoc || !canEdit) return;
    try {
      await shareDocument({ documentId: activeDoc.id, ownerId: currentUser.id, sharedWithUserId: shareUserId });
      setStatus('Document shared. Switch users to verify shared access.');
    } catch (err) { setError(err.message); }
  }

  const shareOptions = useMemo(() => USERS.filter((u) => u.id !== currentUser.id), [currentUser.id]);

  if (!supabaseConfigured) {
    return <div className="mx-auto max-w-3xl p-8"><h1 className="text-2xl font-bold">Ajaia Docs MVP</h1><p className="mt-4 rounded-lg border bg-yellow-50 p-4">Supabase environment variables are missing. Copy <code>.env.example</code> to <code>.env</code>, add your project URL and anon key, run the SQL in <code>src/lib/schema.sql</code>, then restart the app.</p></div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div><h1 className="text-xl font-semibold">Ajaia Docs MVP</h1><p className="text-sm text-gray-500">Lightweight collaborative document editor</p></div>
          <label className="text-sm">Acting as:{' '}<select className="rounded-md border p-2" value={currentUser.id} onChange={(e) => setCurrentUser(USERS.find(u => u.id === e.target.value))}>{USERS.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl grid-cols-[320px_1fr] gap-6 p-6">
        <aside className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-4 flex gap-2">
            <button className="primary" onClick={handleCreate}><Plus size={16}/> New</button>
            <button className="secondary" onClick={() => refreshDocs()}><RefreshCw size={16}/> Refresh</button>
          </div>
          <label className="secondary mb-4 flex cursor-pointer items-center justify-center gap-2"><FileUp size={16}/> Import .txt/.md<input className="hidden" type="file" accept=".txt,.md,text/plain,text/markdown" onChange={handleImport}/></label>
          <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">Documents</h2>
          <div className="space-y-2">{documents.map(doc => <button key={doc.id} className={`w-full rounded-lg border p-3 text-left hover:bg-gray-50 ${activeDoc?.id === doc.id ? 'border-blue-500 bg-blue-50' : ''}`} onClick={() => setActiveDoc(doc)}><div className="font-medium">{doc.title}</div><div className="text-xs text-gray-500">{doc.accessType === 'owned' ? 'Owned by me' : 'Shared with me'}</div></button>)}</div>
        </aside>
        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b p-4">
            <input className="flex-1 rounded-md border px-3 py-2 text-lg font-medium" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!activeDoc} placeholder="Document title" />
            <button className="primary" onClick={handleSave} disabled={!activeDoc}><Save size={16}/> Save</button>
            {canEdit && <><select className="rounded-md border p-2" value={shareUserId} onChange={(e) => setShareUserId(e.target.value)}>{shareOptions.map(user => <option key={user.id} value={user.id}>{user.email}</option>)}</select><button className="secondary" onClick={handleShare}><Share2 size={16}/> Share</button></>}
          </div>
          {error && <p className="mx-4 mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {status && <p className="mx-4 mt-3 rounded bg-green-50 p-3 text-sm text-green-700">{status}</p>}
          <EditorToolbar editor={editor} />
          <EditorContent editor={editor} />
        </section>
      </section>
    </main>
  );
}
