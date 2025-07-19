
const ImageStorage = {
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
          
          localStorage.setItem(`blog-image-${imageId}`, JSON.stringify(imageData));
          
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

  getImage: (imageId) => {
    try {
      const imageData = localStorage.getItem(`blog-image-${imageId}`);
      return imageData ? JSON.parse(imageData) : null;
    } catch (error) {
      console.error('Error retrieving image:', error);
      return null;
    }
  },

  getAllImages: () => {
    try {
      const imageIds = JSON.parse(localStorage.getItem('blog-images') || '[]');
      return imageIds.map(id => ImageStorage.getImage(id)).filter(Boolean);
    } catch (error) {
      console.error('Error retrieving all images:', error);
      return [];
    }
  },

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

const generateImageId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

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
          const MAX_FILE_SIZE = 5 * 1024 * 1024;
          if (file.size > MAX_FILE_SIZE) {
            alert('File too large. Maximum size is 5MB.');
            return;
          }
          
          if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
          }

          const imageId = generateImageId();
          
          const imageData = await ImageStorage.storeImage(file, imageId);
          
          if (imageData && editor) {
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

export const YouTubeInputHandler = ({ onInsert, editor, openModal }) => {
  const handleYouTubeInsert = () => {
    if (openModal) {
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
      const youtubeUrl = window.prompt('Enter YouTube URL:');
      if (youtubeUrl) {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w\-]{11})(?:\S+)?/;
        const match = youtubeUrl.match(regex);

        if (match && match[1]) {
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

export const HTMLInputHandler = ({ onInsert, editor, openModal, showHtmlModal }) => {
  const handleHTMLInsert = () => {
    if (showHtmlModal) {
      showHtmlModal((htmlCode) => {
        if (!htmlCode || !htmlCode.trim()) {
          throw new Error('HTML code cannot be empty');
        }
        
        try {
          const mediaId = `html_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
          const htmlData = {
            id: mediaId,
            type: 'html',
            htmlContent: htmlCode.trim(),
            timestamp: new Date().toISOString()
          };
          
          localStorage.setItem(`blog-image-${mediaId}`, JSON.stringify(htmlData));
          
          const storedImages = JSON.parse(localStorage.getItem('blog-images') || '[]');
          storedImages.push(mediaId);
          localStorage.setItem('blog-images', JSON.stringify(storedImages));
          
          if (editor) {
            editor.commands.insertContent(htmlCode, {
              parseOptions: { preserveWhitespace: 'full' },
            });
          } else if (onInsert) {
            onInsert('html', { content: htmlCode.trim(), mediaId });
          }
        } catch (error) {
          console.error('Error processing HTML:', error);
          alert('Error processing HTML. Please try again.');
        }
      });
    } else if (openModal) {
      openModal(
        'Add HTML Code',
        'Enter your HTML code...',
        (htmlCode) => {
          if (!htmlCode.trim()) {
            throw new Error('HTML code cannot be empty');
          }
          
          try {
            const mediaId = `html_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
            const htmlData = {
              id: mediaId,
              type: 'html',
              htmlContent: htmlCode.trim(),
              timestamp: new Date().toISOString()
            };
            
            localStorage.setItem(`blog-image-${mediaId}`, JSON.stringify(htmlData));
            
            const storedImages = JSON.parse(localStorage.getItem('blog-images') || '[]');
            storedImages.push(mediaId);
            localStorage.setItem('blog-images', JSON.stringify(storedImages));
            
            if (editor) {
              editor.commands.insertContent(htmlCode, {
                parseOptions: { preserveWhitespace: 'full' },
              });
              
              setTimeout(() => {
                console.log('🔧 HTMLInputHandler: Editor content after insert:', editor.getHTML());
              }, 100);
            } else if (onInsert) {
              onInsert('html', { content: htmlCode.trim(), mediaId });
            }
          } catch (error) {
            console.error('Error processing HTML:', error);
            alert('Error processing HTML. Please try again.');
          }
        },
        'textarea'
      );
    } else {
      const htmlCode = window.prompt('Enter HTML code:');
      if (htmlCode && htmlCode.trim()) {
        try {
          const mediaId = `html_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
          
          const htmlData = {
            id: mediaId,
            type: 'html',
            htmlContent: htmlCode.trim(),
            timestamp: new Date().toISOString()
          };
          
          localStorage.setItem(`blog-image-${mediaId}`, JSON.stringify(htmlData));
          
          const storedImages = JSON.parse(localStorage.getItem('blog-images') || '[]');
          storedImages.push(mediaId);
          localStorage.setItem('blog-images', JSON.stringify(storedImages));
          
          if (editor) {
            editor.commands.insertContent(htmlCode, {
              parseOptions: { preserveWhitespace: 'full' },
            });
            
            setTimeout(() => {
              console.log('🔧 HTMLInputHandler: Editor content after insert:', editor.getHTML());
            }, 100);
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

export const BookmarkInputHandler = ({ onInsert, openModal, editor, openBookmarkModal }) => {
  const handleBookmarkInsert = async (bookmarkUrl) => {
    if (!bookmarkUrl || !bookmarkUrl.trim()) {
      throw new Error('URL cannot be empty');
    }

    try {
      const url = new URL(bookmarkUrl.trim());
      const domain = url.hostname;
      
      const loadingHTML = `
        <div class="bookmark-card">
          <div class="bookmark-content">
            <div style="color: #6b7280; font-size: 0.875rem;">Loading bookmark...</div>
          </div>
        </div>
      `;
      
      if (editor) {
        editor.commands.insertContent(loadingHTML, {
          parseOptions: { preserveWhitespace: 'full' },
        });
      }
      
      const { fetchMetadata } = await import('../utils/metadataFetcher');
      const metadata = await fetchMetadata(bookmarkUrl.trim());
      
      const bookmarkHTML = `
        <div class="bookmark-card" data-bookmark-url="${bookmarkUrl.trim()}">
          <a href="${bookmarkUrl.trim()}" target="_blank" rel="noopener noreferrer">
          <div class="bookmark-footer">
            <img src="${metadata.favicon || `https://www.google.com/s2/favicons?sz=16&domain=${domain}`}" alt="" class="bookmark-favicon" onerror="this.style.display='none';" />
            <span class="bookmark-site">
            ${metadata.site || domain}
            </span>
            </div>
            </a>
            <div class="bookmark-content">
              <h4 class="bookmark-title">
                ${metadata.title || domain}
              </h4>
              <p class="bookmark-description">
                ${metadata.description || 'No description available'}
              </p>
            </div>
        </div>
      `;
      
      if (editor) {
        const currentContent = editor.getHTML();
        const updatedContent = currentContent.replace(/Loading bookmark\.\.\./g, '');
        
        editor.commands.selectAll();
        editor.commands.insertContent(updatedContent + bookmarkHTML, {
          parseOptions: { preserveWhitespace: 'full' },
        });
      } else if (onInsert) {
        onInsert('bookmark', { url: bookmarkUrl.trim(), html: bookmarkHTML });
      }
      
    } catch (error) {
      console.error('Error creating bookmark:', error);
      const domain = new URL(bookmarkUrl.trim()).hostname;
      const fallbackHTML = `
        <div class="bookmark-card">
          <a href="${bookmarkUrl.trim()}" target="_blank" rel="noopener noreferrer">
          </a>
            <div class="bookmark-content">
              <p class="bookmark-description">
                Visit ${domain} for more information
              </p>
            </div>
        </div>
      `;
      
      if (editor) {
        editor.commands.insertContent(fallbackHTML, {
          parseOptions: { preserveWhitespace: 'full' },
        });
      }
      
      throw error;
    }
  };

  return () => {
    if (openBookmarkModal) {
      openBookmarkModal();
    } else {
      const bookmarkUrl = window.prompt('Enter bookmark URL:');
      if (bookmarkUrl && bookmarkUrl.trim()) {
        handleBookmarkInsert(bookmarkUrl.trim()).catch(error => {
          alert('Error creating bookmark: ' + error.message);
        });
      }
    }
  };
};

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
          
          const numericId = parseInt(imageId);
          if (isNaN(numericId) || numericId < 0 || numericId > 1084) {
            throw new Error('Invalid image ID. Enter a number between 0 and 1084.\n\nPopular IDs: 237 (dog), 1 (man), 10 (forest), 100 (mountain)');
          }
          
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
      const userInput = window.prompt('Enter Picsum URL or image ID: ');
      
      if (userInput !== null && userInput.trim() !== '') {
        try {
          let imageId = null;
          const width = 800;
          const height = 600;
          
          const input = userInput.trim();
          
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
              alert('Invalid format. Please use:\n• Full URL: https://picsum.photos/id/237/200/300\n• Just ID: 237\n• ID with size: 237/800/600');
              return;
            }
          }
          
          const numericId = parseInt(imageId);
          if (isNaN(numericId) || numericId < 0 || numericId > 1084) {
            alert('Invalid image ID. Please enter a number between 0 and 1084.\n\nPopular IDs:\n• 237 (dog)\n• 1 (man with hat)\n• 10 (forest)\n• 100 (mountain)');
            return;
          }
          
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

export const MediaInputManager = {
  image: ImageUploadHandler,
  imageUrl: ImageURLInputHandler,
  html: HTMLInputHandler,
  bookmark: BookmarkInputHandler,
  youtube: YouTubeInputHandler,
  twitter: TwitterInputHandler,
  picsum: PicsumInputHandler,
  
  divider: ({ onInsert }) => () => onInsert('divider', null),
};

export { ImageStorage };