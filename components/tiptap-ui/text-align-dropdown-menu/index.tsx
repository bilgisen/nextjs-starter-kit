"use client"

import * as React from "react"
import { Editor } from "@tiptap/react"
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from "lucide-react"

import { Button } from "@/components/tiptap-ui-primitive/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/tiptap-ui-primitive/dropdown-menu"

interface TextAlignDropdownMenuProps {
  editor: Editor
}

export function TextAlignDropdownMenu({ editor }: TextAlignDropdownMenuProps) {
  const currentAlignment = (() => {
    if (editor.isActive({ textAlign: 'left' })) return 'left'
    if (editor.isActive({ textAlign: 'center' })) return 'center'
    if (editor.isActive({ textAlign: 'right' })) return 'right'
    if (editor.isActive({ textAlign: 'justify' })) return 'justify'
    return 'left' // Default
  })()

  const getAlignmentIcon = () => {
    switch (currentAlignment) {
      case 'left':
        return <AlignLeft className="h-4 w-4" />
      case 'center':
        return <AlignCenter className="h-4 w-4" />
      case 'right':
        return <AlignRight className="h-4 w-4" />
      case 'justify':
        return <AlignJustify className="h-4 w-4" />
      default:
        return <AlignLeft className="h-4 w-4" />
    }
  }

  const setAlignment = (align: 'left' | 'center' | 'right' | 'justify') => {
    editor.chain().focus().setTextAlign(align).run()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          aria-label="Text alignment"
        >
          {getAlignmentIcon()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setAlignment('left')} className="gap-2">
          <AlignLeft className="h-4 w-4" />
          <span>Left</span>
          {currentAlignment === 'left' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAlignment('center')} className="gap-2">
          <AlignCenter className="h-4 w-4" />
          <span>Center</span>
          {currentAlignment === 'center' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAlignment('right')} className="gap-2">
          <AlignRight className="h-4 w-4" />
          <span>Right</span>
          {currentAlignment === 'right' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAlignment('justify')} className="gap-2">
          <AlignJustify className="h-4 w-4" />
          <span>Justify</span>
          {currentAlignment === 'justify' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
