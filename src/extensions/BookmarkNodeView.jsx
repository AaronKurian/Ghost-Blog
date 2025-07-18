import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';

export const BookmarkNodeView = ({ node }) => {
  const { url, title, description, image, favicon, site } = node.attrs;
  return (
    <NodeViewWrapper className="bookmark-wrapper">
      <div className="bookmark-card border rounded-lg p-4 my-4 bg-gray-50">
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {favicon && <img src={favicon} alt="" className="w-4 h-4" />}
              <span className="text-sm text-gray-500">{site || (url ? new URL(url).hostname : '')}</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">{title || url}</h4>
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </div>
          {image && (
            <div className="w-32 h-24 bg-gray-100 flex-shrink-0 ml-4">
              <img src={image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </a>
      </div>
    </NodeViewWrapper>
  );
};
