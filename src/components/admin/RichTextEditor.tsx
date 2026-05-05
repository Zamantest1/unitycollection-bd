import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Heading2,
  Heading3,
  Quote,
  Undo2,
  Redo2,
  Eraser,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Min visible height in px. */
  minHeight?: number;
}

/**
 * Tiptap-backed rich text editor used in the admin product form.
 *
 * Stored as HTML so admins can paste from ChatGPT / Word / docs and
 * keep formatting (bold, italic, lists, headings, links). The
 * storefront renders this HTML inside a sanitised, prose-styled div —
 * see ProductDetail's description block.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 160,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Keep heading sizes manageable — admins shouldn't be able to
        // splat an h1 in the middle of a product description.
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Write the product description…",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "tiptap-editor prose prose-sm max-w-none focus:outline-none px-3 py-2",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Tiptap renders empty docs as <p></p> — normalise to "" so
      // form validation sees an empty string and doesn't think the
      // admin actually typed something.
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Keep the editor in sync if the parent resets the form (e.g. when
  // switching between create / edit), without thrashing the cursor
  // when the user is actively typing.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = value || "";
    if (current !== incoming && !editor.isFocused) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className="rounded-md border border-input bg-background animate-pulse"
        style={{ minHeight }}
      />
    );
  }

  const promptForLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };

  return (
    <div className="rounded-md border border-input bg-background overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/40 px-2 py-1.5">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Subheading"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={promptForLink}
          title="Insert link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Clear formatting"
        >
          <Eraser className="h-3.5 w-3.5" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo (Ctrl+Z)"
          disabled={!editor.can().undo()}
        >
          <Undo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo (Ctrl+Shift+Z)"
          disabled={!editor.can().redo()}
        >
          <Redo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
      <div style={{ minHeight }} className="cursor-text">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

const Divider = () => <span className="mx-0.5 h-4 w-px bg-border" />;

interface ToolbarButtonProps {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

const ToolbarButton = ({
  active,
  disabled,
  onClick,
  title,
  children,
}: ToolbarButtonProps) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "inline-flex h-7 w-7 items-center justify-center rounded text-xs transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-background hover:text-foreground",
      disabled && "opacity-40 cursor-not-allowed",
    )}
  >
    {children}
  </button>
);
