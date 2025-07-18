import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Image as ImageIcon, 
  CodeXml, 
  Minus, 
  Bookmark, 
  CirclePlay, 
  Mic, 
  Camera 
} from 'lucide-react';
import { 
  ImageUploadHandler, 
  YouTubeInputHandler, 
  HTMLInputHandler, 
  TwitterInputHandler, 
  PicsumInputHandler 
} from './MediaInputHandlers';

const FloatingPlusMenu = ({ editor, isVisible, position, onInsert, openModal, showHtmlModal }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setIsMenuOpen(false);
    }
  }, [isVisible]);

  const handlePlusClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleItemClick = (type) => {
    switch (type) {
      case 'image':
        ImageUploadHandler({ onInsert, editor })();
        break;
      case 'youtube':
        YouTubeInputHandler({ onInsert, editor, openModal })();
        break;
      case 'html':
        HTMLInputHandler({ onInsert, editor, openModal, showHtmlModal })();
        break;
      case 'bookmark':
        // Just call onInsert with 'bookmark' type, let BlogEditor handle the modal
        onInsert('bookmark');
        break;
      case 'twitter':
        TwitterInputHandler({ onInsert, openModal })();
        break;
      case 'picsum':
        PicsumInputHandler({ onInsert, editor, openModal })();
        break;
      case 'divider':
        onInsert('divider');
        break;
      default:
        break;
    }
  };

  const menuItems = [
    { type: 'image', label: 'Photo', icon: ImageIcon },
    // { type: 'imageUrl', label: 'Image URL', icon: ImageIcon },
    { type: 'html', label: 'HTML', icon: CodeXml },
    { type: 'divider', label: 'Divider', icon: Minus },
    { type: 'bookmark', label: 'Bookmark', icon: Bookmark },
    { type: 'youtube', label: 'Youtube', icon: CirclePlay },
    { type: 'twitter', label: 'Twitter', icon: Mic },
    { type: 'picsum', label: 'Picsum', icon: Camera },
  ];

  if (!isVisible) return null;

  return (
    <div 
      className="absolute z-50 pointer-events-none font-sans"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transform: 'none' // Remove any transforms
      }}
    >
      <div className="relative pointer-events-auto" ref={menuRef}>
        <button
          onClick={handlePlusClick}
          onMouseDown={(e) => e.preventDefault()}
          className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-600 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors shadow-sm opacity-90 hover:opacity-100"
        >
          <Plus size={12} className="sm:w-4 sm:h-4 text-white" />
        </button>

        {isMenuOpen && (
          <div className="absolute left-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[140px] sm:min-w-[160px] z-50">
            {menuItems.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => handleItemClick(type)}
                className="w-[95%] px-3 sm:px-4 py-2 text-left hover:bg-gray-100 rounded-sm mx-auto flex items-center space-x-2 sm:space-x-3 text-gray-700 transition-colors text-sm sm:text-base"
              >
                <Icon size={14} className="sm:w-4 sm:h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingPlusMenu;