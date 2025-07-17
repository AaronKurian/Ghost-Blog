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
      
      // Create a shadow container to isolate styles
      const shadowContainer = document.createElement('div');
      shadowContainer.style.cssText = `
        all: initial;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        color: inherit;
        margin: 16px 0;
        * {
          all: unset;
          display: revert;
          box-sizing: border-box;
        }
      `;
      
      // Insert the raw HTML
      shadowContainer.innerHTML = node.attrs.htmlContent;
      
      // Apply styles directly to elements with style attributes
      const styledElements = shadowContainer.querySelectorAll('[style]');
      styledElements.forEach(el => {
        const style = el.getAttribute('style');
        if (style) {
          el.style.cssText = style + ' !important';
        }
      });
      
      dom.appendChild(shadowContainer);
      
      return {
        dom,
        contentDOM: null,
      };
    };
  },
});
