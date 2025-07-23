"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import {
  useEditor,
  EditorContent,
  type Editor,
  type Extensions,
  type Content,
} from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem } from "@tiptap/extension-task-item"
import { TaskList } from "@tiptap/extension-task-list"
import { Typography } from "@tiptap/extension-typography"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Underline } from "@tiptap/extension-underline"
import { Link } from "@/components/tiptap-extension/link-extension"
import { TrailingNode } from "@/components/tiptap-extension/trailing-node-extension"
import { TextAlign } from "@/components/tiptap-extension/text-align-extension"
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { cn, type ClassValue } from "@/lib/utils"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
} from "lucide-react"

const ToolbarSeparator = dynamic(() => import("@/components/tiptap-ui-primitive/toolbar").then(m => m.ToolbarSeparator))
const HeadingDropdownMenu = dynamic(() => import("@/components/tiptap-ui/heading-dropdown-menu").then(m => m.HeadingDropdownMenu))
const ImageUploadButton = dynamic(() => import("@/components/tiptap-ui/image-upload-button").then(m => m.ImageUploadButton))
const BlockquoteButton = dynamic(() => import("@/components/tiptap-ui/blockquote-button").then(m => m.BlockquoteButton))
const CodeBlockButton = dynamic(() => import("@/components/tiptap-ui/code-block-button").then(m => m.CodeBlockButton))
const LinkPopover = dynamic(() => import("@/components/tiptap-ui/link-popover").then(m => m.LinkPopover))
const TextAlignDropdownMenu = dynamic(
  () => import("@/components/tiptap-ui/text-align-dropdown-menu").then(m => m.TextAlignDropdownMenu),
  { ssr: false }
) as unknown as React.ComponentType<{ editor: Editor }>

function getDefaultExtensions(): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      codeBlock: {
        HTMLAttributes: {
          class: "rounded-md bg-muted p-4 font-mono text-sm",
        },
      },
      bulletList: { HTMLAttributes: { class: "list-disc pl-5" } },
      orderedList: { HTMLAttributes: { class: "list-decimal pl-5" } },
      blockquote: {
        HTMLAttributes: {
          class: "border-l-4 border-muted-foreground/20 pl-4 py-1 my-2",
        },
      },
      underline: false,
      link: false,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-primary underline underline-offset-2",
        rel: "noopener noreferrer",
        target: "_blank",
      },
    }),
    Image,
    ImageUploadNode,
    TaskList,
    TaskItem.configure({
      nested: true,
      HTMLAttributes: { class: "flex items-start" },
    }),
    TextAlign,
    Typography,
    Subscript,
    Superscript,
    Underline,
    TrailingNode,
  ]
}

export interface TiptapEditorProps {
  initialContent?: string
  onChange?: (content: string) => void
  className?: string
  editorProps?: {
    attributes?: Record<string, ClassValue>
    handleDOMEvents?: Record<string, unknown>
  }
  editable?: boolean
  extensions?: Extensions
  content?: Content
}

function TiptapEditor({
  initialContent = "",
  onChange = () => {},
  className,
  editorProps = {},
  editable = true,
  content,
  extensions,
}: TiptapEditorProps) {
  const contentToUse = content ?? initialContent
  const editorAttributes = editorProps.attributes ?? {}
  const handleDOMEvents = editorProps.handleDOMEvents ?? {}

  const editor = useEditor({
    extensions: extensions ?? getDefaultExtensions(),
    editable,
    content: contentToUse,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn("prose dark:prose-invert max-w-none focus:outline-none p-4", editorAttributes.class),
        ...editorAttributes,
      },
      handleDOMEvents: {
        keydown: () => false,
        ...handleDOMEvents,
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  })

  if (!editor) {
    return <div className={cn("relative w-full", className)}>Loading editor...</div>
  }

  const toggleMark = (mark: string) => {
    editor.chain().focus()[editor.isActive(mark) ? "unsetMark" : "setMark"](mark).run()
  }

  const toggleList = (type: "bulletList" | "orderedList") => {
    editor.chain().focus()[type === "bulletList" ? "toggleBulletList" : "toggleOrderedList"]().run()
  }

  return (
    <div className={cn("tiptap-editor-container", className)}>
      <div className="tiptap-toolbar">
        <button onClick={() => toggleMark("bold")} className={cn("p-1 rounded", editor.isActive("bold") && "bg-accent")}> <Bold className="w-5 h-5" /> </button>
        <button onClick={() => toggleMark("italic")} className={cn("p-1 rounded", editor.isActive("italic") && "bg-accent")}> <Italic className="w-5 h-5" /> </button>
        <button onClick={() => toggleMark("underline")} className={cn("p-1 rounded", editor.isActive("underline") && "bg-accent")}> <UnderlineIcon className="w-5 h-5" /> </button>
        <ToolbarSeparator />
        <button onClick={() => toggleList("bulletList")} className={cn("p-1 rounded", editor.isActive("bulletList") && "bg-accent")}> <List className="w-5 h-5" /> </button>
        <button onClick={() => toggleList("orderedList")} className={cn("p-1 rounded", editor.isActive("orderedList") && "bg-accent")}> <ListOrdered className="w-5 h-5" /> </button>
        <ToolbarSeparator />
        <HeadingDropdownMenu editor={editor} />
        <ToolbarSeparator />
        <TextAlignDropdownMenu editor={editor} />
        <ToolbarSeparator />
        <BlockquoteButton editor={editor} />
        <CodeBlockButton editor={editor} />
        <ToolbarSeparator />
        <LinkPopover editor={editor} />
        <ToolbarSeparator />
        <ImageUploadButton editor={editor} />
      </div>

      <div className="prose dark:prose-invert max-w-none max-h-[70vh] overflow-y-auto">
        <EditorContent editor={editor} className={cn("tiptap-editor", !editable && "tiptap-readonly")} />
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(TiptapEditor), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  ),
})
