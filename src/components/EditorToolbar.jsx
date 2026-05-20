import React from 'react';

const buttonClass = 'rounded-md border px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-40';

export function EditorToolbar({ editor }) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-2 border-b bg-white p-3">
      <button className={buttonClass} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Bold">Bold</button>
      <button className={buttonClass} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Italic">Italic</button>
      <button className={buttonClass} onClick={() => editor.chain().focus().toggleUnderline().run()} aria-label="Underline">Underline</button>
      <button className={buttonClass} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>Heading</button>
      <button className={buttonClass} onClick={() => editor.chain().focus().toggleBulletList().run()}>Bullets</button>
      <button className={buttonClass} onClick={() => editor.chain().focus().toggleOrderedList().run()}>Numbers</button>
    </div>
  );
}
