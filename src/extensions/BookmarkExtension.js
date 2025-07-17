import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { BookmarkNodeView } from './BookmarkNodeView';

export const BookmarkExtension = Node.create({
  name: 'bookmark',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      url: {
        default: null,
      },
      title: {
        default: null,
      },
      description: {
        default: null,
      },
      image: {
        default: null,
      },
      favicon: {
        default: null,
      },
      site: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-bookmark]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-bookmark': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BookmarkNodeView);
  },

  addCommands() {
    return {
      setBookmark: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});
