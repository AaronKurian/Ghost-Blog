import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { ExternalLink } from 'lucide-react';

export const BookmarkNodeView = ({ node }) => {
  const { url, title, description, image, favicon, site } = node.attrs;

  return (
    <NodeViewWrapper className="bookmark-wrapper">
      <div className="border border-gray-200 rounded-lg overflow-hidden my-4 hover:border-gray-300 transition-colors">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block no-underline hover:no-underline"
          style={{ textDecoration: 'none' }}
        >
          <div className="flex">
            <div className="flex-1 p-4">
              <div className="flex items-center space-x-2 mb-2">
                {favicon && (
                  <img src={favicon} alt="" className="w-4 h-4" />
                )}
                <span className="text-sm text-gray-500">{site || new URL(url).hostname}</span>
                <ExternalLink size={12} className="text-gray-400" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {title || url}
              </h4>
              {description && (
                <p className="text-sm text-gray-600 line-clamp-3">{description}</p>
              )}
            </div>
            {image && (
              <div className="w-32 h-24 bg-gray-100 flex-shrink-0">
                <img
                  src={image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </a>
      </div>
    </NodeViewWrapper>
  );
};
