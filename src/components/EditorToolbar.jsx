import React, { useState } from 'react';

const buttonClass =
  'rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 transition';

export function EditorToolbar({ editor }) {
  const [fontSize, setFontSize] = useState('16');

  if (!editor) return null;

  function applyFontSize(size) {
    setFontSize(size);

    const { from, to } = editor.state.selection;

    if (from === to) {
      return;
    }

    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .run();

    const selectedText = editor.state.doc.textBetween(from, to);

    editor
      .chain()
      .focus()
      .deleteSelection()
      .insertContent(`<span style="font-size: ${size}px">${selectedText}</span>`)
      .run();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-gray-50 p-3">
      <button
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        Bold
      </button>

      <button
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        Italic
      </button>

      <button
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        Underline
      </button>

      <label className="flex items-center gap-2 rounded-md border bg-white px-2 py-1 text-sm">
        Size
        <input
          className="w-16 outline-none"
          type="number"
          min="8"
          max="72"
          value={fontSize}
          onChange={(e) => applyFontSize(e.target.value)}
        />
      </label>

      <button
        className={buttonClass}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        Heading
      </button>

      <button
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        Bullets
      </button>

      <button
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        Numbers
      </button>
    </div>
  );
}