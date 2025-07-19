import { Node } from '@tiptap/core';

export const RawHTMLExtension = Node.create({
  name: 'rawHTML',
  group: 'block',
  atom: true,
  
  addAttributes() {
    return {
      htmlContent: {
        default: '',
        parseHTML: element => element.getAttribute('data-html-content'),
        renderHTML: attributes => {
          return {};
        },
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-raw-html]',
        getAttrs: node => ({
          htmlContent: node.getAttribute('data-html-content'),
        }),
      },
    ];
  },
  
  renderHTML({ node }) {
    return ['div', { 'data-raw-html': 'true', 'data-html-content': node.attrs.htmlContent }, 0];
  },
  
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.setAttribute('data-raw-html', 'true');
      dom.setAttribute('data-html-content', node.attrs.htmlContent);
      
      // Create container that preserves inline styles
      const container = document.createElement('div');
      container.className = 'html-embed-content';
      container.style.cssText = `
        margin: 16px 0;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        color: inherit;
      `;
      
      container.innerHTML = node.attrs.htmlContent;

      dom.appendChild(container);
      
      return {
        dom,
        contentDOM: null,
      };
    };
  },
});
