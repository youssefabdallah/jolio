"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { copy } from "@/copy";

/**
 * Rich achievements editor. The backend contract stays string[]: each
 * top-level block's plain text becomes one bullet, so bold/italic are
 * presentation-only and never leak markup into stored data.
 */
export function bulletsToHtml(bullets: string[]): string {
  if (bullets.length === 0) {
    return "";
  }
  const items = bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("");
  return `<ul>${items}</ul>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Split one block's text on line breaks: pasted text and soft
 *  breaks (Shift+Enter) stay inside a single paragraph node, but the
 *  user meant separate bullets. Pure — unit-tested. */
export function splitBlockText(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

/** Plain text of every top-level block, one bullet per line. List
 *  items split individually — concatenating a whole list into one
 *  bullet would silently merge the user's entries on every keystroke. */
export function editorToBullets(html: string): string[] {
  if (typeof DOMParser === "undefined") {
    return [];
  }
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.querySelector("div");
  if (!root) {
    return [];
  }
  const out: string[] = [];
  for (const block of Array.from(root.children)) {
    // <br> soft breaks count as line breaks: textContent alone would
    // glue them together and fuse pasted text into one bullet.
    const scopes =
      block.tagName === "UL" || block.tagName === "OL" ? Array.from(block.children) : [block];
    for (const scope of scopes) {
      const clone = scope.cloneNode(true) as Element;
      clone.querySelectorAll("br").forEach((br) => br.replaceWith(doc.createTextNode("\n")));
      out.push(...splitBlockText(clone.textContent ?? ""));
    }
  }
  return out;
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={`rich-toolbar-btn ${active ? "rich-toolbar-btn-active" : ""}`}
    >
      {children}
    </button>
  );
}

export default function RichBullets({
  id,
  value,
  describedBy,
  invalid,
  onChange,
}: {
  id: string;
  value: string[];
  describedBy?: string;
  invalid?: boolean;
  onChange: (value: string[]) => void;
}) {
  const editor = useEditor(
    {
      // Required under Next SSR: never render server-side content that
      // the client would immediately replace (hydration mismatch).
      immediatelyRender: false,
      extensions: [StarterKit.configure({ heading: false, blockquote: false, codeBlock: false })],
      content: bulletsToHtml(value),
      editorProps: {
        attributes: {
          id,
          class: "rich-editor",
          "aria-describedby": describedBy ?? "",
          "aria-invalid": invalid ? "true" : "false",
        },
      },
      // The editor instance outlives renders (deps []), so the callback
      // must go through a ref — otherwise keystrokes keep dispatching
      // the mount-time closure over stale parent state and concurrent
      // edits to other fields get silently reverted on save.
      onUpdate: ({ editor: current }) => {
        onChangeRef.current(editorToBullets(current.getHTML()));
      },
    },
    []
  );

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // External value changes (async load) resync the document;
  // own keystrokes already flow through onUpdate, so equal content is
  // left alone to preserve focus and undo history.
  useEffect(() => {
    if (!editor) {
      return;
    }
    const current = editorToBullets(editor.getHTML());
    if (current.join("\n") !== [...value].join("\n")) {
      editor.commands.setContent(bulletsToHtml(value));
    }
  }, [editor, value]);

  return (
    <div className={`rich-wrap ${invalid ? "rich-wrap-invalid" : ""}`}>
      <div role="toolbar" aria-label={copy.profile.bulletsLabel} className="rich-toolbar">
        <ToolbarButton
          label={copy.profile.editorBold}
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <strong aria-hidden="true">B</strong>
        </ToolbarButton>
        <ToolbarButton
          label={copy.profile.editorItalic}
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <em aria-hidden="true">I</em>
        </ToolbarButton>
        <ToolbarButton
          label={copy.profile.editorBullets}
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <span aria-hidden="true">•≡</span>
        </ToolbarButton>
        <ToolbarButton label={copy.profile.editorUndo} onClick={() => editor?.chain().focus().undo().run()}>
          <span aria-hidden="true">↩</span>
        </ToolbarButton>
        <ToolbarButton label={copy.profile.editorRedo} onClick={() => editor?.chain().focus().redo().run()}>
          <span aria-hidden="true">↪</span>
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
