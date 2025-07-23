// components/tiptap-templates/simple/useTiptapEditor.ts
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Editor, EditorOptions } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { Typography } from '@tiptap/extension-typography';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@/components/tiptap-extension/link-extension';
import { TrailingNode } from '@/components/tiptap-extension/trailing-node-extension';
import { TextAlign } from '@/components/tiptap-extension/text-align-extension';
import { ImageUploadNode } from '@/components/tiptap-node/image-upload-node/image-upload-node-extension';

// Configure extensions with proper types and avoid duplicates
const getExtensions = () => {
  // Configure StarterKit with our customizations
  const starterKit = StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    codeBlock: {
      HTMLAttributes: { class: "rounded-md bg-muted p-4 font-mono text-sm" },
    },
    bulletList: {
      HTMLAttributes: { class: "list-disc pl-5" },
    },
    orderedList: {
      HTMLAttributes: { class: "list-decimal pl-5" },
    },
    blockquote: {
      HTMLAttributes: { 
        class: "border-l-4 border-muted-foreground/20 pl-4 py-1 my-2" 
      },
    },
    // Disable extensions that we're providing separately
    underline: false,
    link: false,
  });

  // Configure other extensions
  const linkExtension = Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-primary underline underline-offset-2',
      rel: 'noopener noreferrer',
      target: '_blank',
    },
  });

  const taskItemExtension = TaskItem.configure({ 
    nested: true,
    HTMLAttributes: {
      class: 'flex items-start',
    },
  });

  // Return all extensions in the correct order
  return [
    starterKit,
    Image,
    ImageUploadNode,
    TaskList,
    taskItemExtension,
    TextAlign,
    Typography,
    Highlight,
    Subscript,
    Superscript,
    Underline,
    linkExtension,
    TrailingNode,
  ];
};

export function useTiptapEditor(options: Partial<EditorOptions> = {}) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const isMounted = useRef(false);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize extensions to prevent recreation on every render
  const extensions = useMemo(() => getExtensions(), []);

  const initializeEditor = useCallback(async () => {
    if (typeof window === 'undefined' || isMounted.current) return;
    
    try {
      const { Editor: TiptapEditor } = await import('@tiptap/core');
      
      // Only initialize if we have a valid DOM node
      if (!document) return;
      
      // Create a new element for the editor
      const element = document.createElement('div');
      
      // Get all extensions (both default and any passed in options)
      const allExtensions = [
        ...extensions,
        ...(options.extensions || []),
      ];
      
      // Create editor instance with proper configuration
      const instance = new TiptapEditor({
        element,
        extensions: allExtensions,
        content: options.content,
        editable: options.editable,
        autofocus: options.autofocus,
        injectCSS: true,
        editorProps: {
          ...options.editorProps,
          attributes: {
            class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4',
            ...(options.editorProps?.attributes || {}),
          },
        },
        onUpdate: options.onUpdate,
      });

      setEditor(instance);
      isMounted.current = true;
      setIsLoading(false);
      
      // Cleanup function
      return () => {
        instance.destroy();
      };
    } catch (error) {
      console.error('Failed to initialize Tiptap editor:', error);
      setIsLoading(false);
    }
  }, [options.extensions, options.content, options.editable, options.autofocus, options.editorProps, options.onUpdate, extensions]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cleanup = initializeEditor();
      return () => {
        if (cleanup && typeof cleanup.then === 'function') {
          cleanup.then((cleanupFn) => cleanupFn && cleanupFn());
        } else if (typeof cleanup === 'function') {
          cleanup();
        } else if (editor) {
          editor.destroy();
        }
      };
    }
  }, [initializeEditor, editor]);

  return {
    editor,
    isLoading,
  };
}
