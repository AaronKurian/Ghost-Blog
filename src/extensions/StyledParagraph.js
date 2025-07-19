import { Paragraph } from '@tiptap/extension-paragraph'

export const StyledParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: element => element.getAttribute('style'),
        renderHTML: attributes => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'p',
        getAttrs: node => {
          const style = node.getAttribute('style');
          return style ? { style } : {};
        }
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', HTMLAttributes, 0]
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('p');
      if (node.attrs.style) {
        dom.setAttribute('style', node.attrs.style);
        node.attrs.style.split(';').forEach(style => {
          const [property, value] = style.split(':').map(s => s && s.trim());
          if (property && value) {
            dom.style.setProperty(property, value, 'important');
          }
        });
      }
      return {
        dom,
        contentDOM: dom,
        update: updatedNode => {
          if (updatedNode.attrs.style !== node.attrs.style) {
            if (updatedNode.attrs.style) {
              dom.setAttribute('style', updatedNode.attrs.style);
              updatedNode.attrs.style.split(';').forEach(style => {
                const [property, value] = style.split(':').map(s => s && s.trim());
                if (property && value) {
                  dom.style.setProperty(property, value, 'important');
                }
              });
            } else {
              dom.removeAttribute('style');
              dom.removeAttribute('style');
            }
          }
          return true;
        }
      };
    };
  },
})