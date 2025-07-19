import React, { useState, useEffect } from 'react';
import { X, CodeXml } from 'lucide-react';

const HtmlInputModal = ({ isOpen, onClose, onSubmit, error }) => {
  const [htmlValue, setHtmlValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        document.getElementById('html-input-textarea')?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!htmlValue.trim()) return;
    setIsLoading(true);
    try {
      await onSubmit(htmlValue);
      setHtmlValue('');
      onClose();
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setHtmlValue('');
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50" onClick={handleClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-200"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <CodeXml size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Insert HTML</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="html-input-textarea" className="block text-sm font-medium text-gray-700 mb-2">
                HTML Code
              </label>
              <textarea
                id="html-input-textarea"
                value={htmlValue}
                onChange={e => setHtmlValue(e.target.value)}
                placeholder="Paste or type your HTML code here..."
                className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium cursor-pointer text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!htmlValue.trim() || isLoading}
                className="px-4 py-2 text-sm font-medium cursor-pointer text-white bg-black border border-transparent rounded-md hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Inserting...' : 'Insert HTML'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HtmlInputModal;
