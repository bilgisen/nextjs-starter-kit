import { TextAlign as TiptapTextAlign } from '@tiptap/extension-text-align'

export const TextAlign = TiptapTextAlign.configure({
  types: ['heading', 'paragraph', 'image'],
  alignments: ['left', 'center', 'right', 'justify'],
  defaultAlignment: 'left',
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textAlign: {
      setTextAlign: (alignment: 'left' | 'center' | 'right' | 'justify') => ReturnType
      unsetTextAlign: () => ReturnType
    }
  }
}

export default TextAlign
