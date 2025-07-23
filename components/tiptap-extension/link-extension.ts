import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    link: {
      setLink: (attributes: { href: string; target?: string | null | undefined }) => ReturnType;
      toggleLink: (attributes?: { href: string; target?: string | null | undefined }) => ReturnType;
      unsetLink: () => ReturnType;
    };
  }
}

export const Link = Extension.create({
  name: 'link',
  
  addOptions() {
    return {
      openOnClick: true,
      linkOnPaste: true,
      HTMLAttributes: {},
    };
  },

  addProseMirrorPlugins() {
    const parentPlugins = this.parent?.() || [];
    
    return [
      ...parentPlugins,
      new Plugin({
        key: new PluginKey('handleLinkPaste'),
        props: {
          handleClickOn(view: EditorView, pos: number) {
            const { doc } = view.state;
            const $pos = doc.resolve(pos);
            const mark = $pos.marks().find((mark: { type: { name: string; }; }) => mark.type.name === 'link');

            if (mark) {
              window.open(mark.attrs.href, mark.attrs.target || '_blank');
              return true;
            }

            return false;
          },

          handlePaste(view: EditorView, event: ClipboardEvent) {
            const { state } = view;
            const { selection } = state;
            const { empty } = selection;

            if (empty) {
              return false;
            }

            const text = event.clipboardData?.getData('text/plain');
            if (!text) {
              return false;
            }

            const { from, to } = selection;
            const attrs = { href: text };

            view.dispatch(
              view.state.tr
                .removeMark(from, to, state.schema.marks.link)
                .addMark(from, to, state.schema.marks.link.create(attrs))
            );

            return true;
          },
        },
      }),
    ];
  },

  addExtensions() {
    return [
      Extension.create({
        name: 'link',
        addOptions() {
          return {
            openOnClick: true,
            linkOnPaste: true,
            HTMLAttributes: {},
          };
        },
      }),
    ];
  },
});

export default Link;
