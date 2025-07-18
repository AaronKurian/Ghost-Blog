import React from 'react';
import { Italic, Underline, Heading, List, ListOrdered } from 'lucide-react';
import { PiQuotesFill } from "react-icons/pi";
import { FaBold, FaLink } from "react-icons/fa6";
import { BiHeading } from "react-icons/bi";

const FloatingToolbar = ({ editor, isVisible, position }) => {
  if (!isVisible) return null;

  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor.chain().focus().toggleUnderline().run();
  const toggleH2 = () => editor.chain().focus().toggleHeading({ level: 2 }).run();
  const toggleH3 = () => editor.chain().focus().toggleHeading({ level: 3 }).run();
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();
  const toggleBlockquote = () => editor.chain().focus().toggleBlockquote().run();
  
  const toggleLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div 
      className="fixed z-50 bg-white text-gray-800 border border-gray-300 rounded-lg shadow-lg p-1 flex items-center space-x-1"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transform: 'none'
      }}
    >
      <button
        onClick={toggleBold}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        title="Bold"
      >
        <FaBold size={16} />
      </button>
      <button
        onClick={toggleItalic}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={toggleH2}
        className={`p-2 rounded font-bold hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
        title="Heading 2"
      >
        <BiHeading size={18} />
      </button>
      <button
        onClick={toggleH3}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
        title="Heading 3"
      >
        <Heading size={12} />
      </button>
      <div className="w-px h-8 bg-gray-300 mx-1"></div>
      <button
        onClick={toggleBlockquote}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
        title="Quote"
      >
        <PiQuotesFill size={16} style={{ transform: 'scale(-1, -1)' }} />
      </button>
      <button
        onClick={toggleLink}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
        title="Link"
      >
        <FaLink size={16} />
      </button>
    </div>
  );
};

export default FloatingToolbar;