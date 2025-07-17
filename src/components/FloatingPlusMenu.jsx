import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Image as ImageIcon, 
  Code, 
  Minus, 
  Bookmark, 
  Youtube, 
  Twitter, 
  Camera 
} from 'lucide-react';
import { MediaInputManager } from './MediaInputHandlers';

const FloatingPlusMenu = ({ editor, isVisible, position, onInsert }) => {
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

  const handleMenuClick = (type) => {
    setIsMenuOpen(false);
    
    // Use MediaInputManager for consistent handling
    if (MediaInputManager[type]) {
      const handler = MediaInputManager[type]({ onInsert, editor });
      handler();
    } else {
      // Fallback for types not in MediaInputManager
      switch (type) {
        case 'imageUrl':
          const imageUrl = window.prompt('Enter image URL:');
          if (imageUrl) {
            onInsert('image', { src: imageUrl });
          }
          break;
        default:
          break;
      }
    }
  };

  const menuItems = [
    { type: 'image', label: 'Photo', icon: ImageIcon },
    // { type: 'imageUrl', label: 'Image URL', icon: ImageIcon },
    { type: 'html', label: 'HTML', icon: Code },
    { type: 'divider', label: 'Divider', icon: Minus },
    { type: 'bookmark', label: 'Bookmark', icon: Bookmark },
    { type: 'youtube', label: 'Youtube', icon: Youtube },
    { type: 'twitter', label: 'Twitter', icon: Twitter },
    { type: 'picsum', label: 'Picsum', icon: Camera },
  ];

  if (!isVisible) return null;

  return (
    <div 
      className="absolute z-50 pointer-events-none"
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
          className="w-8 h-8 bg-gray-600 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors shadow-sm opacity-90 hover:opacity-100"
        >
          <Plus size={16} className="text-white" />
        </button>

        {isMenuOpen && (
          <div className="absolute left-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[160px] z-50">
            {menuItems.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => handleMenuClick(type)}
                className="w-[95%] px-4 py-2 text-left hover:bg-gray-100 rounded-sm mx-auto flex items-center space-x-3 text-gray-700 transition-colors"
              >
                <Icon size={16} />
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