import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle } from 'lucide-react';

const CustomModal = ({ isOpen, onClose, title, placeholder, onSubmit, type = 'text', error = null, value, setValue }) => {
  const [localValue, setLocalValue] = useState('');
  const [localError, setLocalError] = useState(error);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (setValue) setValue('');
      setLocalError(null);
      // Focus input after modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, setValue]);

  useEffect(() => {
    setLocalError(error);
  }, [error]);

  const handleSubmit = async () => {
    console.log('🔄 CustomModal handleSubmit called with value:', value);
    console.log('🔄 Value trimmed:', value.trim());
    console.log('🔄 onSubmit type:', typeof onSubmit);
    
    if (!value.trim()) {
      console.log('🔄 Setting error: field required');
      setLocalError('This field is required');
      return;
    }
    
    setLocalError(null);
    console.log('🔄 About to call onSubmit...');
    
    try {
      // Handle both sync and async onSubmit functions
      const result = onSubmit(value.trim());
      
      // If onSubmit returns a promise, wait for it
      if (result && typeof result.then === 'function') {
        await result;
      }
      
      console.log('🔄 onSubmit completed successfully');
      setValue('');
      onClose(); // Close modal on success
    } catch (error) {
      console.error('🔄 Error in onSubmit:', error);
      setLocalError(error.message || 'An error occurred');
    }
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md bg-opacity-20 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              {type === 'textarea' ? (
                <textarea
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors resize-none h-24 sm:h-32 text-sm sm:text-base ${
                    localError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              ) : (
                <input
                  ref={inputRef}
                  type={type}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors text-sm sm:text-base ${
                    localError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )}
              
              {/* Error Message */}
              {localError && (
                <div className="flex items-center mt-2 text-red-600">
                  <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                  <span className="text-sm">{localError}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 text-gray-700 bg-white cursor-pointer border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 sm:px-4 py-2 bg-black text-white cursor-pointer rounded-lg hover:bg-black/80 transition-colors font-medium text-sm sm:text-base"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
