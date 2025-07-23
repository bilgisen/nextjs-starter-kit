'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import type { Editor } from '@tiptap/react'

const SimpleEditor = dynamic(
  () => import('@/components/tiptap-templates/simple/simple-editor'),
  { 
    ssr: false, 
    loading: () => <EditorLoading /> 
  }
)

function EditorLoading({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-muted/50 min-h-[300px] p-4", className)}>
      <p className="text-muted-foreground">Loading editor...</p>
    </div>
  )
}

export interface ChapterContentEditorProps {
  name: string
  className?: string
  initialContent?: string
  disabled?: boolean
  onChange?: (content: string) => void
  editorProps?: {
    attributes?: Record<string, string>
    handleDOMEvents?: Record<string, (props: { editor: Editor; event: Event }) => boolean | void>
  }
}

function ChapterContentEditorComponent({
  name,
  className,
  initialContent = '',
  disabled = false,
  onChange: externalOnChange,
  editorProps = {},
}: ChapterContentEditorProps) {
  const { control, formState: { errors } } = useFormContext()
  const error = errors[name]?.message as string | undefined

  return (
    <div className="w-full">
      <div className={cn("rounded-lg border", className, disabled && 'opacity-50 pointer-events-none')}>
        <Controller
          name={name}
          control={control}
          defaultValue={initialContent}
          render={({ field: { onChange, value } }) => (
            <SimpleEditor
              content={value}
              onChange={(newContent) => {
                onChange(newContent)
                externalOnChange?.(newContent)
              }}
              className="min-h-[400px] w-full"
              editorProps={{
                ...editorProps,
                attributes: {
                  ...editorProps.attributes,
                  class: cn(
                    "prose dark:prose-invert prose-sm sm:prose-base max-w-none p-4 focus:outline-none min-h-[300px] w-full",
                    disabled ? 'cursor-not-allowed bg-muted/50' : 'bg-background',
                    error && 'border border-destructive rounded',
                    editorProps.attributes?.class
                  ),
                },
              }}
              editable={!disabled}
            />
          )}
        />
        {error && (
          <p className="mt-1 text-sm text-destructive px-4">{error}</p>
        )}
      </div>
    </div>
  )
}

export function ChapterContentEditor(props: ChapterContentEditorProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return <EditorLoading className={props.className} />

  return <ChapterContentEditorComponent {...props} />
}

export default ChapterContentEditor
