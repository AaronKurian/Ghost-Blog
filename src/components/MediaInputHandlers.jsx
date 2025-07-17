import React from 'react';

// Local storage utility for images
const ImageStorage = {
  // Store image in localStorage
  storeImage: (file, imageId) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imageData = {
            id: imageId,
            name: file.name,
            type: file.type,
            size: file.size,
            data: reader.result,
            timestamp: new Date().toISOString()
          };
          
          // Store in localStorage
          localStorage.setItem(`blog-image-${imageId}`, JSON.stringify(imageData));
          
          // Keep track of all stored images
          const storedImages = JSON.parse(localStorage.getItem('blog-images') || '[]');
          storedImages.push(imageId);
          localStorage.setItem('blog-images', JSON.stringify(storedImages));
          
          resolve(imageData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Retrieve image from localStorage
  getImage: (imageId) => {
    try {
      const imageData = localStorage.getItem(`blog-image-${imageId}`);
      return imageData ? JSON.parse(imageData) : null;
    } catch (error) {
      console.error('Error retrieving image:', error);
      return null;
    }
  },

  // Get all stored images
  getAllImages: () => {
    try {
      const imageIds = JSON.parse(localStorage.getItem('blog-images') || '[]');
      return imageIds.map(id => ImageStorage.getImage(id)).filter(Boolean);
    } catch (error) {
      console.error('Error retrieving all images:', error);
      return [];
    }
  },

  // Delete image from localStorage
  deleteImage: (imageId) => {
    try {
      localStorage.removeItem(`blog-image-${imageId}`);
      const storedImages = JSON.parse(localStorage.getItem('blog-images') || '[]');
      const updatedImages = storedImages.filter(id => id !== imageId);
      localStorage.setItem('blog-images', JSON.stringify(updatedImages));
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
};

// Generate unique image ID
const generateImageId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Image Upload Handler (File Upload)
export const ImageUploadHandler = ({ onInsert, editor }) => {
  const handleImageUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = false;
    
    fileInput.onchange = async (event) => {
      const file = event.target.files?.[0];
      if (file) {
        try {
          // Check file size (max 5MB)
          const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
          if (file.size > MAX_FILE_SIZE) {
            alert('File too large. Maximum size is 5MB.');
            return;
          }
          
          // Check file type
          if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
          }

          // Generate unique ID for this image
          const imageId = generateImageId();
          
          // Store image in localStorage
          const imageData = await ImageStorage.storeImage(file, imageId);
          
          if (imageData && editor) {
            // Use the proper Tiptap Image extension method instead of insertContent
            editor.chain().focus().setImage({ 
              src: imageData.data,
              alt: imageData.name,
              'data-image-id': imageId,
              'data-image-name': imageData.name
            }).run();
            
            console.log('Image stored in localStorage with ID:', imageId);
            console.log('Total images in storage:', ImageStorage.getAllImages().length);
          } else if (imageData && onInsert) {
            // Fallback to onInsert callback
            onInsert('image', { 
              src: imageData.data,
              alt: imageData.name,
              'data-image-id': imageId,
              'data-image-name': imageData.name
            });
          }
        } catch (error) {
          console.error('Image upload failed:', error);
          alert('Failed to upload image. Please try again.');
        }
      }
    };
    
    fileInput.click();
  };

  return handleImageUpload;
};

// Image URL Input Handler
export const ImageURLInputHandler = ({ onInsert }) => {
  const handleImageURLInsert = () => {
    const imageUrl = window.prompt('Enter image URL:');
    if (imageUrl) {
      onInsert('image', { src: imageUrl });
    }
  };

  return handleImageURLInsert;
};

// HTML Input Handler
export const HTMLInputHandler = ({ onInsert }) => {
  const handleHTMLInsert = () => {
    const htmlCode = window.prompt('Enter HTML code:');
    if (htmlCode) {
      onInsert('html', htmlCode);
    }
  };

  return handleHTMLInsert;
};

// Bookmark Input Handler
export const BookmarkInputHandler = ({ onInsert }) => {
  const handleBookmarkInsert = () => {
    const bookmarkUrl = window.prompt('Enter bookmark URL:');
    if (bookmarkUrl) {
      // Pass the URL object instead of HTML for proper handling
      onInsert('bookmark', { url: bookmarkUrl });
    }
  };

  return handleBookmarkInsert;
};

// YouTube Input Handler
export const YouTubeInputHandler = ({ onInsert }) => {
  const handleYouTubeInsert = () => {
    const youtubeUrl = window.prompt('Enter YouTube URL:');
    if (youtubeUrl) {
      // More comprehensive regex to handle various YouTube URL formats
      const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w\-]{11})(?:\S+)?/;
      const match = youtubeUrl.match(regex);
      
      if (match && match[1]) {
        const videoId = match[1];
        // Create a simpler embed structure
        const embedHTML = `
          <div class="youtube-embed" style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%; margin: 24px 0;">
            <iframe 
              src="https://www.youtube.com/embed/${videoId}" 
              title="YouTube video player"
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px;"
            ></iframe>
          </div>
        `;
        console.log('YouTube embed HTML:', embedHTML);
        console.log('Video ID extracted:', videoId);
        onInsert('html', embedHTML);
      } else {
        alert('Invalid YouTube URL. Please enter a valid YouTube video URL like:\nhttps://www.youtube.com/watch?v=VIDEO_ID\nor\nhttps://youtu.be/VIDEO_ID');
      }
    }
  };

  return handleYouTubeInsert;
};

// Twitter Input Handler
export const TwitterInputHandler = ({ onInsert }) => {
  const handleTwitterInsert = () => {
    const tweetUrl = window.prompt('Enter Twitter URL:');
    if (tweetUrl) {
      const tweetHTML = `
        <div class="tweet-embed border rounded-lg p-4 my-4 bg-gray-50">
          <blockquote class="border-l-4 border-blue-400 pl-4">
            <p class="text-gray-700 mb-2">Twitter embed</p>
            <a href="${tweetUrl}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm">${tweetUrl}</a>
          </blockquote>
        </div>
      `;
      // Use 'rawhtml' instead of 'html' to properly handle the complex HTML structure
      onInsert('rawhtml', tweetHTML);
    }
  };

  return handleTwitterInsert;
};

// Picsum Photos Input Handler (replacing Unsplash)
export const PicsumInputHandler = ({ onInsert }) => {
  const handlePicsumInsert = async () => {
    const userInput = window.prompt('Enter Picsum URL or image ID: ');
    
    if (userInput !== null && userInput.trim() !== '') {
      try {
        let imageId = null;
        const width = 800;
        const height = 600;
        
        const input = userInput.trim();
        
        // Check if it's a full Picsum URL
        const urlMatch = input.match(/picsum\.photos\/id\/(\d+)/);
        if (urlMatch) {
          // Extract ID from URL
          imageId = urlMatch[1];
        } else {
          // Check if it's just an ID or ID/width/height format
          const parts = input.split('/');
          if (parts.length === 1) {
            // Just ID provided
            imageId = parts[0];
          } else if (parts.length === 3) {
            // ID/width/height format - still use our fixed 800x600
            imageId = parts[0];
          } else {
            alert('Invalid format. Please use:\n• Full URL: https://picsum.photos/id/237/200/300\n• Just ID: 237\n• ID with size: 237/800/600');
            return;
          }
        }
        
        // Validate image ID
        const numericId = parseInt(imageId);
        if (isNaN(numericId) || numericId < 0 || numericId > 1084) {
          alert('Invalid image ID. Please enter a number between 0 and 1084.\n\nPopular IDs:\n• 237 (dog)\n• 1 (man with hat)\n• 10 (forest)\n• 100 (mountain)');
          return;
        }
        
        // Generate Picsum URL with extracted ID and fixed 800x600 size
        const imageUrl = `https://picsum.photos/id/${imageId}/${width}/${height}`;
        
        // Test if image loads before inserting
        const testImage = new Image();
        testImage.onload = () => {
          onInsert('image', { src: imageUrl });
        };
        testImage.onerror = () => {
          // Fallback with different approach
          const fallbackSources = [
            `https://picsum.photos/id/${imageId}/${width}/${height}?cache=${Date.now()}`,
            `https://picsum.photos/${width}/${height}?random=${Date.now()}`, // Random fallback
            `https://via.placeholder.com/${width}x${height}/4A90E2/FFFFFF?text=Image+ID+${imageId}`
          ];
          
          let fallbackIndex = 0;
          const tryFallback = () => {
            if (fallbackIndex < fallbackSources.length) {
              const fallbackImage = new Image();
              fallbackImage.onload = () => {
                onInsert('image', { src: fallbackSources[fallbackIndex] });
              };
              fallbackImage.onerror = () => {
                fallbackIndex++;
                tryFallback();
              };
              fallbackImage.src = fallbackSources[fallbackIndex];
            } else {
              alert(`Unable to load image with ID ${imageId}. This ID might not exist.\n\nTry a different ID between 0-1084, or check https://picsum.photos for available images.`);
            }
          };
          
          tryFallback();
        };
        testImage.src = imageUrl;
      } catch (error) {
        console.error('Error processing Picsum request:', error);
        alert('Error processing image request. Please try again.');
      }
    }
  };

  return handlePicsumInsert;
};

// Utility function to clean up unused images
export const cleanupUnusedImages = (editorContent) => {
  const allImages = ImageStorage.getAllImages();
  const usedImageIds = [];
  
  // Extract image IDs from editor content
  const imageIdRegex = /data-image-id="([^"]+)"/g;
  let match;
  while ((match = imageIdRegex.exec(editorContent)) !== null) {
    usedImageIds.push(match[1]);
  }
  
  // Delete unused images
  allImages.forEach(imageData => {
    if (!usedImageIds.includes(imageData.id)) {
      ImageStorage.deleteImage(imageData.id);
      console.log('Cleaned up unused image:', imageData.name);
    }
  });
};

// Main Media Input Manager
export const MediaInputManager = {
  image: ImageUploadHandler,
  imageUrl: ImageURLInputHandler,
  html: HTMLInputHandler,
  bookmark: BookmarkInputHandler,
  youtube: YouTubeInputHandler,
  twitter: TwitterInputHandler,
  picsum: PicsumInputHandler,
  
  // Simple handlers that don't need input
  divider: ({ onInsert }) => () => onInsert('divider', null),
};

// Export storage utilities
export { ImageStorage };