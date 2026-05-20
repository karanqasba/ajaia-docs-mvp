import Underline from '@tiptap/extension-underline';
import React, { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { marked } from 'marked';
import mammoth from 'mammoth';
import Placeholder from '@tiptap/extension-placeholder';
import {
  FileUp,
  Save,
  Share2,
  Plus,
  RefreshCw,
  LogOut,
  Trash2,
  Paperclip,
} from 'lucide-react';

import { EditorToolbar } from './components/EditorToolbar';
import { USERS } from './lib/users';
import { validateDocumentTitle } from './lib/validation';

import {
createDocument,
deleteDocumentForUser,
listDocumentsForUser,
shareDocument,
updateDocument,
} from './lib/documentService';

import { supabaseConfigured } from './lib/supabase';
import './styles.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('karan@ajaia.com');
  const [loginPassword, setLoginPassword] = useState('ajaia123');
  const [loginError, setLoginError] = useState('');

  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [attachments, setAttachments] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const canEdit = activeDoc?.accessType === 'owned';

  const editor = useEditor({
    extensions: [
  StarterKit,
  Underline,
  TextStyle,
  Placeholder.configure({
    placeholder: 'Start writing...',
  }),
],
    content: activeDoc?.content || '<p>Select or create a document.</p>',
    editable: Boolean(activeDoc),
    editorProps: {
      attributes: {
        class:
          'prose max-w-none min-h-[900px] bg-white px-16 py-12 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && activeDoc) {
      editor.commands.setContent(activeDoc.content || '<p></p>');
      editor.setEditable(Boolean(activeDoc));
      setTitle(activeDoc.title || '');
      setHasUnsavedChanges(false);
    }
  }, [activeDoc?.id, editor]);

  useEffect(() => {
    if (!editor) return;

    const updateHandler = () => {
      if (activeDoc && canEdit) {
        setHasUnsavedChanges(true);
        setStatus('Unsaved changes. Auto-save will run shortly.');
      }
    };

    editor.on('update', updateHandler);

    return () => {
      editor.off('update', updateHandler);
    };
  }, [editor, activeDoc?.id, canEdit]);

  useEffect(() => {
    if (!activeDoc || !editor || !hasUnsavedChanges || !canEdit) return;

    const timer = setTimeout(() => {
      handleSave(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, title, activeDoc?.id, canEdit]);

  async function refreshDocs(user = currentUser) {
    if (!user) return;

    try {
      setError('');
      setStatus('Loading documents...');

      const docs = await listDocumentsForUser(user.id);

      setDocuments(docs);

      setActiveDoc(
        (current) =>
          docs.find((doc) => doc.id === current?.id) ||
          docs[0] ||
          null
      );

      setStatus('Documents loaded.');
    } catch (err) {
      setError(err.message);
      setStatus('');
    }
  }

  useEffect(() => {
    if (supabaseConfigured && currentUser) {
      refreshDocs(currentUser);
    }
  }, [currentUser?.id]);

  function handleLogin(e) {
    e.preventDefault();

    const user = USERS.find(
      (u) =>
        u.email.toLowerCase() === loginEmail.toLowerCase().trim() &&
        u.password === loginPassword
    );

    if (!user) {
      setLoginError('Invalid email or password. Use one of the seeded demo accounts.');
      return;
    }

    setLoginError('');
    setCurrentUser(user);
  }

  function handleLogout() {
    setCurrentUser(null);
    setDocuments([]);
    setActiveDoc(null);
    setTitle('');
    setStatus('');
    setError('');
    setShareEmail('');
    setHasUnsavedChanges(false);
    if (editor) {
  editor.commands.clearContent();
}
  }

  async function handleCreate() {
    try {
      setError('');

      const existingUntitled = documents.filter(
        (doc) =>
          doc.accessType === 'owned' &&
          doc.title.toLowerCase().startsWith('untitled document')
      ).length;

      const newTitle =
        existingUntitled === 0
          ? 'Untitled document'
          : `Untitled document ${existingUntitled + 1}`;

      const doc = await createDocument({
        title: newTitle,
        ownerId: currentUser.id,
      });

      setDocuments((prev) => [doc, ...prev]);
      setActiveDoc(doc);
      setStatus('New document created.');
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSave(isAutoSave = false) {
    if (!activeDoc || !editor) return;

    const validationError = validateDocumentTitle(title);

    if (validationError) {
      setError(validationError);
      return;
    }

    const duplicateTitle = documents.some(
      (doc) =>
        doc.id !== activeDoc.id &&
        doc.accessType === 'owned' &&
        doc.title.toLowerCase().trim() === title.toLowerCase().trim()
    );

    if (duplicateTitle) {
      setError('You already have a document with this name.');
      return;
    }

    try {
      setError('');
      setStatus(isAutoSave ? 'Auto-saving...' : 'Saving document...');

      const saved = await updateDocument({
        id: activeDoc.id,
        title,
        content: editor.getHTML(),
      });

      const updated = {
        ...activeDoc,
        ...saved,
        title,
        content: editor.getHTML(),
      };

      setActiveDoc(updated);

      setDocuments((prev) =>
        prev.map((doc) => (doc.id === updated.id ? updated : doc))
      );

      setHasUnsavedChanges(false);
      setStatus(isAutoSave ? 'Auto-saved.' : 'Saved successfully.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function parseFileToHtml(file) {
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'txt') {
      const text = await file.text();

      return `<p>${text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/\n/g, '</p><p>')}</p>`;
    }

    if (extension === 'md') {
      const markdown = await file.text();
      return marked(markdown);
    }

    if (extension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();

      const result = await mammoth.convertToHtml({
        arrayBuffer,
      });

      return result.value;
    }

    throw new Error('Supported formats: .txt, .md, .docx');
  }

  async function handleImportAsNewDocument(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      setStatus('Importing document...');

      const html = await parseFileToHtml(file);

      const baseTitle = file.name.replace(/\.(txt|md|docx)$/i, '');
      const duplicateTitle = documents.some(
        (doc) =>
          doc.accessType === 'owned' &&
          doc.title.toLowerCase().trim() === baseTitle.toLowerCase().trim()
      );

      if (duplicateTitle) {
        setError('You already have a document with this imported file name.');
        return;
      }

      const doc = await createDocument({
        title: baseTitle,
        ownerId: currentUser.id,
        content: html,
      });

      setDocuments((prev) => [doc, ...prev]);
      setActiveDoc(doc);
      setHasUnsavedChanges(false);
      setStatus('Document imported as a new editable document.');
    } catch (err) {
      setError(err.message || 'Failed to import file.');
    } finally {
      event.target.value = '';
    }
  }

  async function handleImportIntoCurrentDraft(event) {
    const file = event.target.files?.[0];
    if (!file || !editor || !activeDoc) return;

    try {
      setError('');
      setStatus('Importing content into current draft...');

      const html = await parseFileToHtml(file);

      editor.commands.insertContent(html);
      setHasUnsavedChanges(true);

      setStatus('File content imported into current draft. Auto-save will run shortly.');
    } catch (err) {
      setError(err.message || 'Failed to import into draft.');
    } finally {
      event.target.value = '';
    }
  }

  function handleAttachFile(event) {
    const file = event.target.files?.[0];
    if (!file || !activeDoc) return;

    setAttachments((prev) => ({
      ...prev,
      [activeDoc.id]: [
        ...(prev[activeDoc.id] || []),
        {
          name: file.name,
          size: file.size,
          type: file.type || 'unknown',
          attachedAt: new Date().toISOString(),
        },
      ],
    }));

    setStatus('Attachment associated with this document for the current session.');
    event.target.value = '';
  }
async function handleDeleteDocument(doc) {
  if (!doc) return;

  const confirmed = window.confirm(
    doc.accessType === 'owned'
      ? 'Delete this document for everyone?'
      : 'Remove this shared document from your view?'
  );

  if (!confirmed) return;

  try {
    setError('');
    setStatus('Deleting document...');

    await deleteDocumentForUser({
      documentId: doc.id,
      userId: currentUser.id,
      accessType: doc.accessType,
    });

    const updatedDocs = documents.filter((item) => item.id !== doc.id);
    setDocuments(updatedDocs);

    if (activeDoc?.id === doc.id) {
      const nextDoc = updatedDocs[0] || null;
      setActiveDoc(nextDoc);

      if (!nextDoc && editor) {
        editor.commands.clearContent();
        setTitle('');
      }
    }

    setStatus(
      doc.accessType === 'owned'
        ? 'Document deleted for all users.'
        : 'Shared document removed from your view.'
    );
  } catch (err) {
    setError(err.message);
  }
}
  async function handleShare() {
    if (!activeDoc || !canEdit) return;

    if (hasUnsavedChanges) {
      setError('Please wait for auto-save or click Save before sharing.');
      return;
    }

    const userToShareWith = USERS.find(
      (u) => u.email.toLowerCase() === shareEmail.toLowerCase().trim()
    );

    if (!userToShareWith) {
      setError('No seeded user found with that email.');
      return;
    }

    if (userToShareWith.id === currentUser.id) {
      setError('You already own this document.');
      return;
    }

    try {
      await shareDocument({
        documentId: activeDoc.id,
        ownerId: currentUser.id,
        sharedWithUserId: userToShareWith.id,
      });

      setStatus(`Document shared with ${userToShareWith.email}.`);
      setShareEmail('');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!supabaseConfigured) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-bold">Ajaia Docs MVP</h1>
        <p className="mt-4 rounded-lg border bg-yellow-50 p-4">
          Supabase environment variables are missing.
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f1f3f4] px-4">
        <section className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <img
              src="/ajaia-logo.png"
              alt="Ajaia"
              className="mx-auto mb-4 h-16 object-contain"
            />

            <h1 className="text-2xl font-semibold text-gray-900">
              Ajaia Docs
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Sign in with a seeded demo account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>

              <input
                className="w-full rounded-lg border px-3 py-2"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="karan@ajaia.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>

              <input
                className="w-full rounded-lg border px-3 py-2"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="ajaia123"
              />
            </div>

            {loginError && (
              <p className="rounded bg-red-50 p-3 text-sm text-red-700">
                {loginError}
              </p>
            )}

            <button className="primary w-full justify-center" type="submit">
              Log in
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            Demo users: karan@ajaia.com, adam@ajaia.com, sasha@ajaia.com
            <br />
            Password: ajaia123
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f1f3f4] text-gray-900">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-blue-600">Docs</div>

            <img
              src="/ajaia-logo.png"
              alt="Ajaia"
              className="h-10 object-contain"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
              {currentUser.initials}
            </div>

            <div className="hidden text-sm sm:block">
              <div className="font-medium">{currentUser.name}</div>
              <div className="text-gray-500">{currentUser.email}</div>
            </div>

            <button className="secondary" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl grid-cols-[320px_1fr] gap-6 p-6">
        <aside className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-4 flex gap-2">
            <button className="primary" onClick={handleCreate}>
              <Plus size={16} />
              New
            </button>

            <button className="secondary" onClick={() => refreshDocs()}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <label className="secondary mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium hover:bg-gray-100">
            <FileUp size={16} />
            Upload as new doc

            <input
              className="hidden"
              type="file"
              accept=".txt,.md,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleImportAsNewDocument}
            />
          </label>

          <label className="secondary mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium hover:bg-gray-100">
            <FileUp size={16} />
            Import into draft

            <input
              className="hidden"
              type="file"
              accept=".txt,.md,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleImportIntoCurrentDraft}
            />
          </label>

          <label
            className={`secondary mb-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium hover:bg-gray-100 ${
              !activeDoc ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            <Paperclip size={16} />
            Attach file

            <input
              className="hidden"
              type="file"
              onChange={handleAttachFile}
              disabled={!activeDoc}
            />
          </label>

          <p className="mb-4 text-xs text-gray-500">
            Supported imports: .txt, .md, .docx
          </p>

          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">
            Documents
          </h2>

          <div className="space-y-2">
  {documents.map((doc) => (
    <div
      key={doc.id}
      className={`rounded-lg border p-3 transition hover:bg-gray-50 ${
        activeDoc?.id === doc.id
          ? 'border-blue-500 bg-blue-50'
          : ''
      }`}
    >
      <button
        className="w-full text-left"
        onClick={() => setActiveDoc(doc)}
      >
        <div className="truncate font-medium">{doc.title}</div>

        <div className="mt-2 text-xs">
          {doc.accessType === 'owned' ? (
            <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">
              Owned
            </span>
          ) : (
            <span className="rounded bg-green-100 px-2 py-1 text-green-700">
              Shared
            </span>
          )}
        </div>
      </button>

      <button
        className="mt-3 flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
        onClick={() => handleDeleteDocument(doc)}
      >
        <Trash2 size={14} />
        {doc.accessType === 'owned'
          ? 'Delete for everyone'
          : 'Remove from my view'}
      </button>
    </div>
  ))}
</div>
        </aside>

        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b bg-white p-4">
            <input
              className="flex-1 rounded-md border px-4 py-2 text-lg font-medium"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (activeDoc && canEdit) {
                  setHasUnsavedChanges(true);
                  setStatus('Unsaved changes. Auto-save will run shortly.');
                }
              }}
              disabled={!activeDoc}
              placeholder="Document title"
            />

            <button
              className="primary"
              onClick={() => handleSave(false)}
              disabled={!activeDoc}
            >
              <Save size={16} />
              Save
            </button>

            {canEdit && (
              <>
                <input
                  className="rounded-md border p-2"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Enter email to share"
                />

                <button
                  className="secondary"
                  onClick={handleShare}
                  disabled={!activeDoc || hasUnsavedChanges}
                  title={
                    hasUnsavedChanges
                      ? 'Save document before sharing'
                      : 'Share document'
                  }
                >
                  <Share2 size={16} />
                  Share
                </button>
              </>
            )}
          </div>

          {error && (
            <p className="mx-4 mt-3 rounded bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {status && (
            <p
              className={`mx-4 mt-3 rounded p-3 text-sm ${
                hasUnsavedChanges
                  ? 'bg-yellow-50 text-yellow-700'
                  : 'bg-green-50 text-green-700'
              }`}
            >
              {status}
            </p>
          )}

          {activeDoc && attachments[activeDoc.id]?.length > 0 && (
            <div className="mx-4 mt-3 rounded bg-blue-50 p-3 text-sm text-blue-700">
              <strong>Attachments:</strong>{' '}
              {attachments[activeDoc.id].map((file) => file.name).join(', ')}
            </div>
          )}

          <EditorToolbar editor={editor} />

          <div className="bg-[#f1f3f4] p-10">
            <div className="mx-auto max-w-4xl rounded-sm bg-white shadow">
              <EditorContent editor={editor} />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}