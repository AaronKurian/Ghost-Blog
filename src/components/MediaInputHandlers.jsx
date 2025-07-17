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
          } else if (imageData && onInsert) {
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
export const ImageURLInputHandler = ({ onInsert, openModal }) => {
  const handleImageURLInsert = () => {
    if (openModal) {
      openModal(
        'Add Image from URL',
        'Enter image URL (e.g., https://example.com/image.jpg)',
        (imageUrl) => {
          if (!imageUrl.trim()) {
            throw new Error('Image URL cannot be empty');
          }
          
          try {
            new URL(imageUrl);
          } catch {
            throw new Error('Please enter a valid URL');
          }
          
          onInsert('image', { src: imageUrl });
        }
      );
    } else {
      const imageUrl = window.prompt('Enter image URL:');
      if (imageUrl) {
        onInsert('image', { src: imageUrl });
      }
    }
  };

  return handleImageURLInsert;
};

// YouTube Input Handler
export const YouTubeInputHandler = ({ onInsert, editor, openModal }) => {
  const handleYouTubeInsert = () => {
    if (openModal) {
      // Use custom modal if available
      openModal(
        'Add YouTube Video',
        'Enter YouTube URL (e.g., https://youtu.be/dQw4w9WgXcQ)',
        (youtubeUrl) => {
          const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w\-]{11})(?:\S+)?/;
          const match = youtubeUrl.match(regex);

          if (!match || !match[1]) {
            throw new Error('Invalid YouTube URL. Please enter a valid YouTube video URL.');
          }

          const videoId = match[1];
          if (editor) {
            const mediaId = `youtube_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
            editor.chain().focus().insertContent({
              type: 'iframe',
              attrs: {
                src: `https://www.youtube.com/embed/${videoId}`,
                width: '100%',
                height: '400',
                frameborder: '0',
                allowfullscreen: 'true',
                class: 'rounded-lg w-full h-96 my-4',
                'data-media-id': mediaId,
                'data-media-type': 'youtube',
                'data-youtube-id': videoId
              }
            }).run();

            // Store YouTube embed info in localStorage for restoration
            const youtubeData = {
              id: mediaId,
              type: 'youtube',
              videoId,
              url: youtubeUrl,
              timestamp: new Date().toISOString()
            };
            localStorage.setItem(`blog-image-${mediaId}`, JSON.stringify(youtubeData));
            const storedImages = JSON.parse(localStorage.getItem('blog-images') || '[]');
            storedImages.push(mediaId);
            localStorage.setItem('blog-images', JSON.stringify(storedImages));
          } else if (onInsert) {
            onInsert('youtube', { videoId, url: youtubeUrl });
          }
        }
      );
    } else {
      // Fallback to window.prompt
      const youtubeUrl = window.prompt('Enter YouTube URL:');
      if (youtubeUrl) {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w\-]{11})(?:\S+)?/;
        const match = youtubeUrl.match(regex);

        if (match && match[1]) {
          const videoId = match[1];
          // Use IframeExtension for YouTube embeds
          if (editor) {
            const mediaId = `youtube_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
            editor.chain().focus().insertContent({
              type: 'iframe',
              attrs: {
                src: `https://www.youtube.com/embed/${videoId}`,
                width: '100%',
                height: '400',
                frameborder: '0',
                allowfullscreen: 'true',
                class: 'rounded-lg w-full h-96 my-4',
                'data-media-id': mediaId,
                'data-media-type': 'youtube',
                'data-youtube-id': videoId
              }
            }).run();

            // Store YouTube embed info in localStorage for restoration
            const youtubeData = {
              id: mediaId,
              type: 'youtube',
              videoId,
              url: youtubeUrl,
              timestamp: new Date().toISOString()
            };
            localStorage.setItem(`blog-image-${mediaId}`, JSON.stringify(youtubeData));
            const storedImages = JSON.parse(localStorage.getItem('blog-images') || '[]');
            storedImages.push(mediaId);
            localStorage.setItem('blog-images', JSON.stringify(storedImages));
          } else if (onInsert) {
            onInsert('youtube', { videoId, url: youtubeUrl });
          }
        } else {
          alert('Invalid YouTube URL. Please enter a valid YouTube video URL.');
        }
      }
    }
  };

  return handleYouTubeInsert;
};

// HTML Input Handler
export const HTMLInputHandler = ({ onInsert, editor, openModal }) => {
  const handleHTMLInsert = () => {
    if (openModal) {
      // Use custom modal if available
      openModal(
        'Add HTML Code',
        'Enter your HTML code...',
        (htmlCode) => {
          if (!htmlCode.trim()) {
            throw new Error('HTML code cannot be empty');
          }
          
          // Generate unique ID for this HTML embed
          const mediaId = `html_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
          
          // Store HTML data in localStorage
          const htmlData = {
            id: mediaId,
            type: 'html',
            htmlContent: htmlCode.trim(),
            timestamp: new Date().toISOString()
          };
          
          // Store in localStorage using same pattern as other media
          localStorage.setItem(`blog-image-${mediaId}`, JSON.stringify(htmlData));
          
          // Keep track of all stored media
          const storedImages = JSON.parse(localStorage.getItem('blog-images') || '[]');
          storedImages.push(mediaId);
          localStorage.setItem('blog-images', JSON.stringify(storedImages));
          
          if (editor) {
            // FIXED: Insert HTML directly using insertContent with proper wrapper
            const wrappedHTML = `<div class="html-embed" data-media-id="${mediaId}" data-media-type="html" data-html-content="${htmlCode.replace(/"/g, '&quot;')}" style="margin: 16px 0;">${htmlCode}</div>`;
            
            editor.commands.insertContent(wrappedHTML, {
              parseOptions: { preserveWhitespace: 'full' },
            });
          } else if (onInsert) {
            onInsert('html', { content: htmlCode.trim(), mediaId });
          }
        },
        'textarea'
      );
    } else {
      // Fallback to window.prompt
      const htmlCode = window.prompt('Enter HTML code:');
      if (htmlCode && htmlCode.trim()) {
        try {
          // Generate unique ID for this HTML embed
          const mediaId = `html_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
          
          // Store HTML data in localStorage
          const htmlData = {
            id: mediaId,
            type: 'html',
            htmlContent: htmlCode.trim(),
            timestamp: new Date().toISOString()
          };
          
          // Store in localStorage using same pattern as other media
          localStorage.setItem(`blog-image-${mediaId}`, JSON.stringify(htmlData));
          
          // Keep track of all stored media
          const storedImages = JSON.parse(localStorage.getItem('blog-images') || '[]');
          storedImages.push(mediaId);
          localStorage.setItem('blog-images', JSON.stringify(storedImages));
          
          if (editor) {
            // FIXED: Insert HTML directly using insertContent with proper wrapper
            const wrappedHTML = `<div class="html-embed" data-media-id="${mediaId}" data-media-type="html" data-html-content="${htmlCode.replace(/"/g, '&quot;')}" style="margin: 16px 0;">${htmlCode}</div>`;
            
            editor.commands.insertContent(wrappedHTML, {
              parseOptions: { preserveWhitespace: 'full' },
            });
          } else if (onInsert) {
            onInsert('html', { content: htmlCode.trim(), mediaId });
          }
        } catch (error) {
          console.error('Error processing HTML:', error);
          alert('Error processing HTML. Please try again.');
        }
      }
    }
  };

  return handleHTMLInsert;
};

// Bookmark Input Handler
export const BookmarkInputHandler = ({ onInsert, openModal }) => {
  const handleBookmarkInsert = () => {
    if (openModal) {
      openModal(
        'Add Bookmark',
        'Enter bookmark URL (e.g., https://example.com)',
        (bookmarkUrl) => {
          if (!bookmarkUrl.trim()) {
            throw new Error('URL cannot be empty');
          }
          
          try {
            new URL(bookmarkUrl);
          } catch {
            throw new Error('Please enter a valid URL');
          }
          
          onInsert('bookmark', { url: bookmarkUrl });
        }
      );
    } else {
      const bookmarkUrl = window.prompt('Enter bookmark URL:');
      if (bookmarkUrl) {
        onInsert('bookmark', { url: bookmarkUrl });
      }
    }
  };

  return handleBookmarkInsert;
};

// Twitter Input Handler
export const TwitterInputHandler = ({ onInsert, openModal }) => {
  const handleTwitterInsert = () => {
    if (openModal) {
      openModal(
        'Add Twitter Post',
        'Enter Twitter URL (e.g., https://twitter.com/user/status/123456)',
        (tweetUrl) => {
          if (!tweetUrl.trim()) {
            throw new Error('Twitter URL cannot be empty');
          }
          
          try {
            new URL(tweetUrl);
          } catch {
            throw new Error('Please enter a valid URL');
          }
          
          const tweetHTML = `
            <div class="tweet-embed border rounded-lg p-4 my-4 bg-gray-50">
              <blockquote class="border-l-4 border-blue-400 pl-4">
                <p class="text-gray-700 mb-2">Twitter embed</p>
                <a href="${tweetUrl}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm">${tweetUrl}</a>
              </blockquote>
            </div>
          `;
          onInsert('rawhtml', tweetHTML);
        }
      );
    } else {
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
        onInsert('rawhtml', tweetHTML);
      }
    }
  };

  return handleTwitterInsert;
};

// Picsum Photos Input Handler (replacing Unsplash)
export const PicsumInputHandler = ({ onInsert, editor, openModal }) => {
  const handlePicsumInsert = async () => {
    if (openModal) {
      openModal(
        'Add Picsum Photo',
        'Enter Picsum URL or image ID (e.g., 237 or https://picsum.photos/id/237)',
        (userInput) => {
          if (!userInput.trim()) {
            throw new Error('Input cannot be empty');
          }
          
          let imageId = null;
          const width = 800;
          const height = 600;
          
          const input = userInput.trim();
          
          // Check if it's a full Picsum URL
          const urlMatch = input.match(/picsum\.photos\/id\/(\d+)/);
          if (urlMatch) {
            imageId = urlMatch[1];
          } else {
            const parts = input.split('/');
            if (parts.length === 1) {
              imageId = parts[0];
            } else if (parts.length === 3) {
              imageId = parts[0];
            } else {
              throw new Error('Invalid format. Use:\n• Image ID: 237\n• Full URL: https://picsum.photos/id/237');
            }
          }
          
          // Validate image ID
          const numericId = parseInt(imageId);
          if (isNaN(numericId) || numericId < 0 || numericId > 1084) {
            throw new Error('Invalid image ID. Enter a number between 0 and 1084.\n\nPopular IDs: 237 (dog), 1 (man), 10 (forest), 100 (mountain)');
          }
          
          // Generate Picsum URL and insert image
          const imageUrl = `https://picsum.photos/id/${imageId}/${width}/${height}`;
          
          const testImage = new Image();
          testImage.onload = () => {
            if (editor) {
              const storageId = Date.now().toString(36) + Math.random().toString(36).substr(2);
              const imageHTML = `<img src="${imageUrl}" alt="Picsum Photo ${imageId}" class="rounded-lg max-w-full h-auto my-4" data-image-id="${storageId}" data-image-name="picsum-${imageId}.jpg" data-picsum-id="${imageId}" />`;
              editor.commands.insertContent(imageHTML);
            } else if (onInsert) {
              onInsert('image', { src: imageUrl, alt: `Picsum Photo ${imageId}` });
            }
          };
          testImage.onerror = () => {
            throw new Error(`Unable to load image with ID ${imageId}. Try a different ID.`);
          };
          testImage.src = imageUrl;
        }
      );
    } else {
      // Fallback to window.prompt (existing code)
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
            // FIXED: Use the proper insertion method for BlogEditor compatibility
            if (editor) {
              // Generate unique storage ID for this Picsum image
              const storageId = Date.now().toString(36) + Math.random().toString(36).substr(2);
              
              // Insert image with proper data attributes for storage compatibility
              const imageHTML = `<img src="${imageUrl}" alt="Picsum Photo ${imageId}" class="rounded-lg max-w-full h-auto my-4" data-image-id="${storageId}" data-image-name="picsum-${imageId}.jpg" data-picsum-id="${imageId}" />`;
              
              editor.commands.insertContent(imageHTML);
            } else if (onInsert) {
              onInsert('image', { src: imageUrl, alt: `Picsum Photo ${imageId}` });
            }
          };
          testImage.onerror = () => {
            const fallbackSources = [
              `https://picsum.photos/id/${imageId}/${width}/${height}?cache=${Date.now()}`,
              `https://picsum.photos/${width}/${height}?random=${Date.now()}`,
              `https://via.placeholder.com/${width}x${height}/4A90E2/FFFFFF?text=Image+ID+${imageId}`
            ];
            
            let fallbackIndex = 0;
            const tryFallback = () => {
              if (fallbackIndex < fallbackSources.length) {
                const fallbackImage = new Image();
                fallbackImage.onload = () => {
                  if (editor) {
                    const storageId = Date.now().toString(36) + Math.random().toString(36).substr(2);
                    const imageHTML = `<img src="${fallbackSources[fallbackIndex]}" alt="Picsum Photo ${imageId}" class="rounded-lg max-w-full h-auto my-4" data-image-id="${storageId}" data-image-name="picsum-${imageId}.jpg" />`;
                    editor.commands.insertContent(imageHTML);
                  } else if (onInsert) {
                    onInsert('image', { src: fallbackSources[fallbackIndex], alt: `Picsum Photo ${imageId}` });
                  }
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
    }
  };

  return handlePicsumInsert;
};

// Utility function to clean up unused images
export const cleanupUnusedImages = (editorContent) => {
  const allImages = ImageStorage.getAllImages();
  const usedImageIds = [];
  
  const imageIdRegex = /data-image-id="([^"]+)"/g;
  let match;
  while ((match = imageIdRegex.exec(editorContent)) !== null) {
    usedImageIds.push(match[1]);
  }
  
  allImages.forEach(imageData => {
    if (!usedImageIds.includes(imageData.id)) {
      ImageStorage.deleteImage(imageData.id);
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