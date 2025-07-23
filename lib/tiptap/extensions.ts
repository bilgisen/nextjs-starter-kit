import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Typography } from '@tiptap/extension-typography';

export const extensions = [
  StarterKit.configure({
    // Disable the default extensions we're replacing
    heading: false,
    bulletList: false,
    orderedList: false,
    listItem: false,
    blockquote: false,
    codeBlock: false,
    horizontalRule: false,
    dropcursor: false,
    gapcursor: false,
  }),
  
  // Customize the heading levels
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  
  // Add other extensions with custom configurations
  Image.configure({
    inline: true,
    allowBase64: true,
  }),
  
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      rel: 'noopener noreferrer',
      class: 'text-blue-600 hover:underline',
    },
  }),
  
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  
  Underline,
  Subscript,
  Superscript,
  
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  
  Typography,
];
