'use client';

import React, { useState, useCallback } from 'react';
import { Pencil, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import SortableTree, { TreeItem } from '@nosferatu500/react-sortable-tree';
import FileExplorerTheme from 'react-sortable-tree-theme-minimal';
import '@nosferatu500/react-sortable-tree/style.css';
import type { ChapterNode } from '@/types/dnd';

interface Props {
  chapters: ChapterNode[];
  onSave: (updatedChapters: ChapterNode[]) => void;
  onEdit?: (chapterId: string) => void;
  onView?: (chapterId: string) => void;
  onDelete?: (chapterId: string) => void;
  className?: string;
}

interface TreeNode extends TreeItem {
  id: string;
  title: string;
  children?: TreeNode[];
}

export function RstChapterTree({ 
  chapters, 
  onSave, 
  onEdit,
  onView,
  onDelete,
  className
}: Props) {
  console.log('RstChapterTree - Raw chapters:', chapters);
  const treeNodes = convertToTree(chapters);
  console.log('RstChapterTree - Converted tree nodes:', treeNodes);
  const [treeData, setTreeData] = useState<TreeNode[]>(treeNodes);

  const handleTreeChange = (data: TreeNode[]) => {
    setTreeData(data);
    onSave(flattenTree(data));
  };

  const renderNode = useCallback(({ node }: { node: TreeNode }) => {
    return {
      title: (
        <div className="flex items-center justify-between w-full group">
          <span className="text-gray-800 dark:text-gray-100 font-medium">
            {node.title}
          </span>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onView && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(node.id);
                }}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            )}
            {onEdit && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(node.id);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-destructive hover:text-destructive/90"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      ),
    };
  }, [onEdit, onView, onDelete]);

  return (
    <div className={cn("react-sortable-tree h-[600px] overflow-auto", className)}>
      <SortableTree
        treeData={treeData}
        onChange={handleTreeChange}
        getNodeKey={({ node }) => node.id}
        generateNodeProps={renderNode}
        theme={{
          ...FileExplorerTheme,
          row: 'py-1',
          node: 'py-1',
          rowContents: 'p-2 rounded-md',
          rowContentsDragDisabled: 'p-2',
          rowWrapper: 'p-0.5',
          rowTitle: 'text-sm font-medium',
          rowTitleWithSubtitle: 'text-sm',
          rowSubtitle: 'text-xs text-muted-foreground',
          rowTitleText: 'flex items-center',
          collapseButton: 'p-1 rounded hover:bg-muted',
          expandButton: 'p-1 rounded hover:bg-muted',
          expandButtonWrapper: 'flex items-center',
        }}
        canDrag={({ node }) => !node.dragDisabled}
        canDrop={({ nextParent }) => !nextParent?.dragDisabled}
        slideRegionSize={50}
        rowHeight={48}
        scaffoldBlockPxWidth={24}
        maxDepth={3}
        shouldCopyOnOutsideDrop={() => false}
        dndType="ChapterNode"
      />
    </div>
  );
}

function convertToTree(nodes: ChapterNode[], parentId: string | null = null): TreeNode[] {
  return nodes
    .filter((n) => n.parent_chapter_id === parentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((n) => ({
      id: n.id,
      title: n.title,
      children: convertToTree(nodes, n.id),
    }));
}

function flattenTree(tree: TreeNode[], parentId: string | null = null): ChapterNode[] {
  let result: ChapterNode[] = [];

  tree.forEach((node, index) => {
    result.push({
      id: node.id,
      title: node.title,
      parent_chapter_id: parentId,
      order: index,
    });

    if (node.children) {
      result = result.concat(flattenTree(node.children, node.id));
    }
  });

  return result;
}
