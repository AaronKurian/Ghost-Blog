import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { BookmarkNodeView } from './BookmarkNodeView';

export const BookmarkExtension = Node.create({
  name: 'bookmark',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      url: { default: null },
      title: { default: null },
      description: { default: null },
      image: { default: null },
      favicon: { default: null },
      site: { default: null },
      mediaId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-bookmark]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-bookmark': '' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BookmarkNodeView);
  },

  addCommands() {
    return {
      setBookmark: attrs => ({ chain }) => {
        console.log('🟢 [BookmarkExtension] setBookmark command called with:', attrs);
        return chain().insertContent({
          type: this.name,
          attrs,
        });
      },
    };
  },
});