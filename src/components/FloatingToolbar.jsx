import React from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  Quote,
  Heading2,
  Heading3,
  List,
  ListOrdered
} from 'lucide-react';

const FloatingToolbar = ({ editor, isVisible, position }) => {
  if (!isVisible || !editor) return null;

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
        left: position.x, 
        top: position.y,
        transform: 'translateX(-50%)'
      }}
    >
      <button
        onClick={toggleBold}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
      >
        <Bold size={16} />
      </button>
      <button
        onClick={toggleItalic}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
      >
        <Italic size={16} />
      </button>
      {/* <button
        onClick={toggleUnderline}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
      >
        <Underline size={16} />
      </button> */}
      <button
        onClick={toggleH2}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
      >
        <Heading2 size={16} />
      </button>
      <button
        onClick={toggleH3}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
      >
        <Heading3 size={16} />
      </button>
      <div className="w-px h-8 bg-gray-300 mx-1"></div>
      {/* <button
        onClick={toggleBulletList}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
      >
        <List size={16} />
      </button>
      <button
        onClick={toggleOrderedList}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
      >
        <ListOrdered size={16} />
      </button> */}
      <button
        onClick={toggleBlockquote}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
      >
        <Quote size={16} />
      </button>
      <button
        onClick={toggleLink}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
      >
        <Link size={16} />
      </button>
    </div>
  );
};

export default FloatingToolbar;
