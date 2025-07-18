import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEditor, EditorContent } from '@tiptap/react';
import { Node } from '@tiptap/core';
import { throttle } from 'throttle-debounce';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { StyledParagraph } from '../extensions/StyledParagraph';
import { addPost, updatePost, setCurrentPost, setLastSaved } from '../store/postsSlice';
import { BookmarkExtension } from '../extensions/BookmarkExtension.js';
import { RawHTMLExtension } from '../extensions/RawHTMLExtension';
import { fetchMetadata } from '../utils/metadataFetcher';
import FloatingToolbar from './FloatingToolbar';
import FloatingPlusMenu from './FloatingPlusMenu';
import { VscCloudUpload } from "react-icons/vsc";
import { ChevronLeft, PanelRight } from 'lucide-react';
import { ImageStorage } from '../utils/imageStorage';
import CustomModal from './CustomModal';
import BookmarkModal from './BookmarkModal';
import { BookmarkInputHandler } from './MediaInputHandlers';
import HtmlInputModal from './HtmlInputModal';

// Simple YouTube embed function
const createYouTubeEmbed = (url) => {
  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  if (videoId) {
    return `
      <div class="video-embed my-6">
        <div class="relative w-full h-0 pb-[56.25%]">
          <iframe 
            src="https://www.youtube.com/embed/${videoId[1]}" 
            frameborder="0" 
            allowfullscreen
            class="absolute top-0 left-0 w-full h-full rounded-lg"
          ></iframe>
        </div>
      </div>
    `;
  }
  return null;
};

// Add a custom extension to allow iframes
const IframeExtension = Node.create({
  name: 'iframe',
  group: 'block',
  atom: true,
  
  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      frameborder: {
        default: 0,
      },
      allowfullscreen: {
        default: true,
      },
      class: {
        default: null,
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'iframe',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['iframe', HTMLAttributes];
  },
});

const BlogEditor = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isNew = id === 'new';
  
  const posts = useSelector(state => state.posts.posts);
  const currentPost = useSelector(state => state.posts.currentPost);
  const lastSaved = useSelector(state => state.posts.lastSaved);
  
  const [postTitle, setPostTitle] = useState('');
  const [plusMenuVisible, setPlusMenuVisible] = useState(false);
  const [plusMenuPosition, setPlusMenuPosition] = useState({ x: 0, y: 0 });
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasInitialContent, setHasInitialContent] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    placeholder: '',
    type: 'text',
    onSubmit: null,
    error: null
  });

  const [bookmarkModal, setBookmarkModal] = useState({
    isOpen: false,
    error: null
  });

  const [htmlModal, setHtmlModal] = useState({
    isOpen: false,
    error: null,
    onSubmit: null,
  });

  const editorRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const autosaveRef = useRef(null);
  const postInitializedRef = useRef(false);
  const editorContentSetRef = useRef(false);
  const editorReadyRef = useRef(false);

  // Modal functions
  const openModal = (title, placeholder, onSubmit, type = 'text') => {
    setModalConfig({
      isOpen: true,
      title,
      placeholder,
      type,
      onSubmit,
      error: null
    });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false, error: null }));
  };

  const handleModalSubmit = (value) => {
    console.log('🎯 handleModalSubmit called with value:', value);
    console.log('🎯 modalConfig.onSubmit exists:', !!modalConfig.onSubmit);
    
    try {
      if (modalConfig.onSubmit) {
        console.log('🎯 Calling modalConfig.onSubmit...');
        modalConfig.onSubmit(value);
        console.log('🎯 modalConfig.onSubmit completed');
      } else {
        console.error('🎯 No onSubmit function in modalConfig');
      }
      closeModal();
    } catch (error) {
      console.error('🎯 Error in handleModalSubmit:', error);
      setModalConfig(prev => ({ ...prev, error: error.message }));
    }
  };

  const openBookmarkModal = () => {
    setBookmarkModal({ isOpen: true, error: null });
  };

  const closeBookmarkModal = () => {
    setBookmarkModal({ isOpen: false, error: null });
  };

  const handleBookmarkSubmit = async (url) => {
    try {
      // Create bookmark directly here instead of using the handler
      if (!url || !url.trim()) {
        throw new Error('URL cannot be empty');
      }

      const urlObj = new URL(url.trim());
      const domain = urlObj.hostname;
      
      // Show loading state first
      const loadingHTML = `
        <div class="bookmark-card">
          <div class="bookmark-content">
            <div style="color: #6b7280; font-size: 0.875rem;">Loading bookmark...</div>
          </div>
        </div>
      `;
      
      // Insert loading state first
      if (editor) {
        editor.commands.insertContent(loadingHTML, {
          parseOptions: { preserveWhitespace: 'full' },
        });
      }
      
      // Import and fetch real metadata
      const { fetchMetadata } = await import('../utils/metadataFetcher');
      const metadata = await fetchMetadata(url.trim());
      
      // Create beautiful bookmark with real data using CSS classes
      const bookmarkHTML = `
        <div class="bookmark-card" data-bookmark-url="${url.trim()}">
          <a href="${url.trim()}" target="_blank" rel="noopener noreferrer">
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
      
      // Replace loading state with actual bookmark
      if (editor) {
        const currentContent = editor.getHTML();
        const updatedContent = currentContent.replace(/Loading bookmark\.\.\./g, '');
        
        // Clear and insert the new bookmark
        editor.commands.selectAll();
        editor.commands.insertContent(updatedContent + bookmarkHTML, {
          parseOptions: { preserveWhitespace: 'full' },
        });
      }
      
    } catch (error) {
      console.error('Error creating bookmark:', error);
      setBookmarkModal(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  };

  // Initialize or find post
  useEffect(() => {
    if (isNew) {
      if (!postInitializedRef.current) {
        const newPost = {
          id: Date.now(),
          title: '',
          excerpt: '',
          content: '',
          status: 'draft',
          coverImage: null,
          coverImageId: null, // NEW: Store cover image ID
          imageIds: []
        };
        dispatch(setCurrentPost(newPost));
        setPostTitle('');
        postInitializedRef.current = true;
        editorContentSetRef.current = false;
        setIsInitialized(false);
      }
    } else {
      const post = posts.find(p => p.id === parseInt(id));
      if (post) {
        if (!postInitializedRef.current) {
          const postWithImageIds = {
            ...post,
            imageIds: post.imageIds || [],
            coverImageId: post.coverImageId || null
          };
          dispatch(setCurrentPost(postWithImageIds));
          setPostTitle(post.title);
          postInitializedRef.current = true;
          editorContentSetRef.current = false;
          setIsInitialized(false);
        }
      } else {
        navigate('/');
      }
    }
  }, [id, isNew, navigate, dispatch]);

  // Reset initialization when route changes
  useEffect(() => {
    postInitializedRef.current = false;
    editorContentSetRef.current = false;
    editorReadyRef.current = false; // FIXED: Reset editor ready flag too
  }, [id]);

  // Enhanced autosave function - FIXED to prevent duplicates
  const autosave = throttle(2000, (title, content) => {
    if (currentPost && editor && isInitialized) {
      const excerpt = editor.getText().substring(0, 300);
      const finalExcerpt = excerpt.length > 0 ? excerpt + '...' : '';
      const imageIds = extractImageIds(content);
      
      const updatedPost = {
        ...currentPost,
        title: title || 'Untitled Post',
        content,
        excerpt: finalExcerpt,
        imageIds
      };
      
      const hasRealContent = title.trim().length > 0 || editor.getText().trim().length > 0;
      
      if (isNew) {
        if (hasRealContent) {
          const currentPosts = posts;
          const existingPost = currentPosts.find(p => p.id === currentPost.id);
          
          if (!existingPost) {
            const contentSetFlag = editorContentSetRef.current;
            const postInitFlag = postInitializedRef.current;
            
            dispatch(addPost(updatedPost));
            
            setTimeout(() => {
              editorContentSetRef.current = contentSetFlag;
              postInitializedRef.current = postInitFlag;
            }, 0);
          } else {
            dispatch(updatePost(updatedPost));
          }
          dispatch(setLastSaved(new Date().toISOString()));
        }
      } else {
        dispatch(updatePost(updatedPost));
        dispatch(setLastSaved(new Date().toISOString()));
      }
    }
  });

  // FIXED: Extract media IDs from content (images + youtube + html)
  const extractImageIds = (htmlContent) => {
    const imageIds = [];
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const allImages = doc.querySelectorAll('img');
    
    const youtubeEmbeds = doc.querySelectorAll('div[data-media-type="youtube"], iframe[data-youtube-id]');
    
    youtubeEmbeds.forEach((embed, index) => {
      const youtubeId = embed.getAttribute('data-media-id') || embed.getAttribute('data-youtube-id');
      if (youtubeId) {
        imageIds.push(youtubeId);
      }
    });
    
    const htmlEmbeds = doc.querySelectorAll('div[data-raw-html="true"], div[data-media-type="html"]');
    
    htmlEmbeds.forEach((embed, index) => {
      const htmlId = embed.getAttribute('data-media-id');
      if (htmlId) {
        imageIds.push(htmlId);
      }
    });
    
    const images = doc.querySelectorAll('img[data-image-id], img[data-image-name]');
    
    images.forEach(img => {
      const imageId = img.getAttribute('data-image-id') || img.getAttribute('data-image-name');
      if (imageId) {
        imageIds.push(imageId);
      }
    });
    
    if (imageIds.length === 0 && allImages.length > 0) {
      const storedImages = JSON.parse(localStorage.getItem('blog-images') || '[]');
      
      allImages.forEach(img => {
        const imgSrc = img.src;
        storedImages.forEach(storedId => {
          try {
            const imageData = localStorage.getItem(`blog-image-${storedId}`);
            if (imageData) {
              const parsedData = JSON.parse(imageData);
              if (parsedData.data === imgSrc) {
                imageIds.push(storedId);
              }
            }
          } catch (error) {
            console.error('Error checking stored image:', storedId, error);
          }
        });
      });
    }
    
    return imageIds;
  };

  // UPDATED: Image upload handler with FORCED attribute setting
  const handleImageUpload = async (file) => {
    try {
      if (file.size > 5 * 1024 * 1024) {
        alert('File too large. Maximum size is 5MB.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }

      const imageId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      
      const imageData = await new Promise((resolve, reject) => {
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
      
      if (editor) {
        const imageHTML = `<img src="${imageData.data}" alt="${imageData.name}" class="rounded-lg max-w-full h-auto my-4" data-image-id="${imageData.id}" data-image-name="${imageData.name}" data-stored-id="${imageData.id}" />`;
        
        editor.commands.insertContent(imageHTML);
        
        setTimeout(() => {
          const currentContent = editor.getHTML();
          const extractedIds = extractImageIds(currentContent);
        }, 100);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false, // disable default paragraph
        heading: {
          levels: [2, 3],
        },
      }),
      StyledParagraph, // use our custom styled paragraph instead
      Placeholder.configure({
        placeholder: 'Begin writing your post...',
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ['http', 'https'],
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
        // FIXED: Allow custom data attributes to be preserved
        allowBase64: true,
        inline: false,
        addAttributes() {
          return {
            ...this.parent?.(),
            'data-image-id': {
              default: null,
              parseHTML: element => element.getAttribute('data-image-id'),
              renderHTML: attributes => {
                if (!attributes['data-image-id']) {
                  return {}
                }
                return {
                  'data-image-id': attributes['data-image-id']
                }
              },
            },
            'data-image-name': {
              default: null,
              parseHTML: element => element.getAttribute('data-image-name'),
              renderHTML: attributes => {
                if (!attributes['data-image-name']) {
                  return {}
                }
                return {
                  'data-image-name': attributes['data-image-name']
                }
              },
            },
            'data-stored-id': {
              default: null,
              parseHTML: element => element.getAttribute('data-stored-id'),
              renderHTML: attributes => {
                if (!attributes['data-stored-id']) {
                  return {}
                }
                return {
                  'data-stored-id': attributes['data-stored-id']
                }
              },
            },
          }
        },
      }),
      IframeExtension,
      BookmarkExtension,
      RawHTMLExtension,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] px-8 py-6',
      },
      handleKeyDown: (view, event) => {
        setTimeout(() => triggerSelectionCheck(), 10);
        return false;
      },
      handleClick: () => {
        setTimeout(() => triggerSelectionCheck(), 10);
        return false;
      },
    },
    parseOptions: {
      preserveWhitespace: 'full',
    },
    onUpdate: ({ editor }) => {
      setTimeout(() => triggerSelectionCheck(), 10);
      
      setIsTyping(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Autosave after user stops typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        if (isInitialized) {
          const hasContent = editor.getText().trim().length > 0;
          const hasTitle = postTitle.trim().length > 0;
          
          // Only autosave if we have both title AND content, or if it's an existing post
          if ((hasTitle && hasContent) || !isNew) {
            autosave(postTitle, editor.getHTML());
          }
        }
      }, 1000);
    },
    onSelectionUpdate: ({ editor }) => {
      handleSelectionChange(editor);
    },
    onFocus: ({ editor }) => {
      setTimeout(() => {
        handleSelectionChange(editor);
      }, 10);
    },
    onBlur: () => {
      setTimeout(() => {
        setPlusMenuVisible(false);
        setToolbarVisible(false);
      }, 200);
    },
    onCreate: ({ editor }) => {
      setTimeout(() => {
        editorReadyRef.current = true;
      }, 100);
    },
  });

  // Define bookmark processing function completely outside handleMediaInsert
  const processBookmark = useCallback(async (url, mediaId) => {
    console.log('📖 processBookmark function called with URL:', url);
    console.log('📖 URL type:', typeof url, 'length:', url?.length);
    console.log('📖 Media ID:', mediaId);
    
    if (!url || !url.trim()) {
      console.error('📖 URL is empty');
      throw new Error('URL cannot be empty');
    }

    const trimmedUrl = url.trim();
    console.log('📖 Trimmed URL:', trimmedUrl);

    // Basic URL validation
    try {
      const validatedUrl = new URL(trimmedUrl);
      console.log('📖 URL validation passed:', validatedUrl.href);
    } catch (urlError) {
      console.error('📖 URL validation failed:', urlError);
      throw new Error('Please enter a valid URL');
    }

    try {
      console.log('📖 About to fetch metadata...');
      const metadata = await fetchMetadata(trimmedUrl);
      console.log('📖 Metadata received:', metadata);
      
      // Store bookmark data in localStorage for persistence
      const bookmarkData = {
        id: mediaId,
        type: 'bookmark',
        url: trimmedUrl,
        title: metadata.title || 'Bookmark',
        description: metadata.description || trimmedUrl,
        image: metadata.image,
        favicon: metadata.favicon,
        site: metadata.site,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(`blog-image-${mediaId}`, JSON.stringify(bookmarkData));
      
      const storedImages = JSON.parse(localStorage.getItem('blog-images') || '[]');
      storedImages.push(mediaId);
      localStorage.setItem('blog-images', JSON.stringify(storedImages));
      
      // Check if BookmarkExtension is registered and has the setBookmark command
      if (editor.commands.setBookmark) {
        console.log('📖 Using BookmarkExtension with command:', editor.commands.setBookmark);
        
        editor.chain().focus().setBookmark({
          url: trimmedUrl,
          title: metadata.title || 'Bookmark',
          description: metadata.description || trimmedUrl,
          image: metadata.image,
          favicon: metadata.favicon,
          site: metadata.site,
        }).run();
        
        console.log('📖 BookmarkExtension insertion completed');
      } else {
        console.log('📖 Using fallback HTML bookmark implementation');
        
        // Use a fallback HTML implementation if the extension isn't working
        const bookmarkHTML = `
          <div class="bookmark-card border rounded-lg p-4 my-4 bg-gray-50" data-media-id="${mediaId}" data-media-type="bookmark">
            <a href="${trimmedUrl}" target="_blank" rel="noopener noreferrer" class="flex">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-2">
                  ${metadata.favicon ? `<img src="${metadata.favicon}" alt="" class="w-4 h-4" />` : ''}
                  <span class="text-sm text-gray-500">${metadata.site || new URL(trimmedUrl).hostname}</span>
                </div>
                <h4 class="font-semibold text-gray-900 mb-2">${metadata.title || trimmedUrl}</h4>
                ${metadata.description ? `<p class="text-sm text-gray-600">${metadata.description}</p>` : ''}
              </div>
              ${metadata.image ? `
                <div class="w-32 h-24 bg-gray-100 flex-shrink-0 ml-4">
                  <img src="${metadata.image}" alt="" class="w-full h-full object-cover" />
                </div>
              ` : ''}
            </a>
          </div>
        `;
        
        console.log('📖 Inserting bookmark HTML');
        editor.commands.insertContent(bookmarkHTML, {
          parseOptions: { preserveWhitespace: 'full' },
        });
      }
      
      console.log('📖 Bookmark inserted successfully');
    } catch (error) {
      console.error('📖 Error creating bookmark:', error);
      throw new Error('Failed to create bookmark: ' + error.message);
    }
  }, [editor, fetchMetadata]);

  // UPDATED: Media insertion handler with proper async handling
  const handleMediaInsert = async (type, data) => {
    if (!editor) return;
    
    editor.commands.focus();
    
    const mediaId = `${type}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    switch (type) {
      case 'image':
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = async (event) => {
          const file = event.target.files?.[0];
          if (file) {
            await handleImageUpload(file);
          }
        };
        fileInput.click();
        break;

      case 'youtube':
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
            
            const youtubeData = {
              id: mediaId,
              type: 'youtube',
              videoId: videoId,
              url: youtubeUrl,
              timestamp: new Date().toISOString()
            };
            
            localStorage.setItem(`blog-image-${mediaId}`, JSON.stringify(youtubeData));
            
            const storedImages = JSON.parse(localStorage.getItem('blog-images') || '[]');
            storedImages.push(mediaId);
            localStorage.setItem('blog-images', JSON.stringify(storedImages));
            
            const embedHTML = `
              <div class="video-embed my-6" data-media-id="${mediaId}" data-media-type="youtube" data-youtube-id="${mediaId}">
                <div class="relative w-full h-0 pb-[56.25%]">
                  <iframe 
                    src="https://www.youtube.com/embed/${videoId}" 
                    title="YouTube video player"
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                    class="absolute top-0 left-0 w-full h-full rounded-lg"
                    data-youtube-id="${mediaId}"
                  ></iframe>
                </div>
              </div>
            `;
            
            editor.commands.insertContent(embedHTML, {
              parseOptions: { preserveWhitespace: 'full' },
            });
          }
        );
        break;

      case 'html':
      case 'rawhtml':
        openModal(
          'Add HTML Code',
          'Enter your HTML code...',
          (htmlCode) => {
            if (!htmlCode.trim()) {
              throw new Error('HTML code cannot be empty');
            }

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
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlCode;
            tempDiv.setAttribute('data-raw-html', 'true');
            tempDiv.setAttribute('data-media-id', mediaId);
            tempDiv.setAttribute('data-media-type', 'html');
            tempDiv.setAttribute('data-html-content', htmlCode.replace(/"/g, '&quot;'));
            tempDiv.style.margin = '16px 0';
            
            editor.commands.insertContent('<p>TEMP_HTML_PLACEHOLDER</p>');
            
            setTimeout(() => {
              const editorDOM = editor.view.dom;
              const placeholder = editorDOM.querySelector('p:contains("TEMP_HTML_PLACEHOLDER")');
              if (placeholder) {
                placeholder.parentNode.replaceChild(tempDiv, placeholder);
              }
            }, 10);
          },
          'textarea'
        );
        break;

      case 'bookmark':
        // Open the bookmark modal instead of using window.prompt
        openBookmarkModal();
        break;

      case 'divider':
        editor.chain().focus().setHorizontalRule().run();
        break;
      default:
        break;
    }
    
    setPlusMenuVisible(false);
  };

  // Handle title change - simplified logic
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setPostTitle(newTitle);
    
    // Don't trigger immediate autosave for title-only changes
    // Let the regular typing timeout handle it
    if (isInitialized && editor) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Use same timeout as content changes to avoid premature saves
      typingTimeoutRef.current = setTimeout(() => {
        const hasContent = editor.getText().trim().length > 0;
        const hasTitle = newTitle.trim().length > 0;
        
        // Only autosave if we have both title AND content, or if it's an existing post
        if ((hasTitle && hasContent) || !isNew) {
          autosave(newTitle, editor.getHTML());
        }
      }, 1000);
    }
  };

  // UPDATED: Publish post function - ensure it's properly defined
  const publishPost = useCallback(() => {
    if (currentPost && editor) {
      const finalTitle = postTitle.trim() || 'Untitled Post';
      const content = editor.getHTML();
      const excerpt = editor.getText().substring(0, 160);
      const finalExcerpt = excerpt.length > 0 ? excerpt + '...' : '';
      const imageIds = extractImageIds(content);
      
      const publishedPost = {
        ...currentPost,
        title: finalTitle,
        content,
        excerpt: finalExcerpt,
        status: 'published',
        imageIds,
        coverImage: coverImage,
        coverImageId: currentPost.coverImageId
      };
      
      const existingPost = posts.find(p => p.id === currentPost.id);
      if (!existingPost) {
        dispatch(addPost(publishedPost));
        console.log('Published new post:', publishedPost.title);
      } else {
        dispatch(updatePost(publishedPost));
        console.log('Published existing post:', publishedPost.title);
      }
      
      dispatch(setLastSaved(new Date().toISOString()));
      navigate('/');
    }
  }, [currentPost, editor, postTitle, extractImageIds, coverImage, posts, dispatch, navigate]);

  // Handle cover image upload
  const handleCoverImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        alert('File too large. Maximum size is 5MB.');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const coverImageId = `cover_${Date.now()}_${Math.random().toString(36).substr(2)}`;
          
          const coverImageData = {
            id: coverImageId,
            name: file.name,
            type: file.type,
            size: file.size,
            data: e.target.result,
            timestamp: new Date().toISOString(),
            isCoverImage: true
          };
          
          localStorage.setItem(`blog-image-${coverImageId}`, JSON.stringify(coverImageData));
          
          const storedImages = JSON.parse(localStorage.getItem('blog-images') || '[]');
          storedImages.push(coverImageId);
          localStorage.setItem('blog-images', JSON.stringify(storedImages));
          
          setCoverImage(e.target.result);
          
          if (currentPost) {
            const updatedPost = {
              ...currentPost,
              coverImage: e.target.result,
              coverImageId: coverImageId
            };
            dispatch(setCurrentPost(updatedPost));
          }
        } catch (error) {
          console.error('Failed to store cover image:', error);
          setCoverImage(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove cover image
  const handleRemoveCoverImage = () => {
    setCoverImage(null);
    
    if (currentPost) {
      const updatedPost = {
        ...currentPost,
        coverImage: null,
        coverImageId: null
      };
      dispatch(setCurrentPost(updatedPost));
    }
  };

  // Handle cover image click
  const handleCoverImageClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = handleCoverImageUpload;
    fileInput.click();
  };

  // Handle cover image drag and drop
  const handleCoverImageDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } };
      handleCoverImageUpload(fakeEvent);
    }
  };

  const handleCoverImageDragOver = (event) => {
    event.preventDefault();
  };

  // Enhanced selection handling that triggers on various events
  const triggerSelectionCheck = () => {
    if (editor && editor.view && editor.view.dom && editor.view.editable) {
      setTimeout(() => {
        handleSelectionChange(editor);
      }, 10);
    }
  };

  // Handle selection change - fixed positioning logic with better error handling
  const handleSelectionChange = (editor) => {
    if (!editor || !editor.view) return;
    
    try {
      const { selection } = editor.state;
      const { from, to } = selection;
      
      if (!editor.view.dom || !editor.view.coordsAtPos) {
        return;
      }
      
      if (from === to) {
        const $from = selection.$from;
        const currentLineText = $from.parent.textContent || '';
        const hasContentOnLine = currentLineText.trim().length > 0;
        
        if (!hasContentOnLine) {
          const coords = editor.view.coordsAtPos(from);
          const editorElement = editor.view.dom;
          const editorRect = editorElement.getBoundingClientRect();
          
          const containerElement = editorRef.current;
          const containerRect = containerElement ? containerElement.getBoundingClientRect() : { left: 0, top: 0 };
          
          setPlusMenuPosition({
            x: editorRect.left - containerRect.left - 10,
            y: coords.top - containerRect.top
          });
          setPlusMenuVisible(true);
          setToolbarVisible(false);
        } else {
          setPlusMenuVisible(false);
          setToolbarVisible(false);
        }
      } else {
        const startCoords = editor.view.coordsAtPos(from);
        const endCoords = editor.view.coordsAtPos(to);
        
        const centerX = (startCoords.left + endCoords.right) / 2;
        const selectionTop = Math.min(startCoords.top, endCoords.top);
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        const toolbarWidth = 200;
        const toolbarHeight = 50;
        
        let x = centerX - (toolbarWidth / 2);
        let y = selectionTop - toolbarHeight - 10;
        
        if (x < 10) {
          x = 10;
        } else if (x + toolbarWidth > viewportWidth - 10) {
          x = viewportWidth - toolbarWidth - 10;
        }
        
        if (y < 10) {
          y = Math.max(startCoords.bottom, endCoords.bottom) + 10;
        }
        
        if (y + toolbarHeight > viewportHeight - 10) {
          y = viewportHeight - toolbarHeight - 10;
        }
        
        setToolbarPosition({ x, y });
        setToolbarVisible(true);
        setPlusMenuVisible(false);
      }
    } catch (error) {
      console.error('Error in handleSelectionChange:', error);
      setPlusMenuVisible(false);
      setToolbarVisible(false);
    }
  };

  // DEBUG: Log current post and editor state
  useEffect(() => {
    if (currentPost) {
      console.log('Current Post:', currentPost);
      console.log('Editor Content:', editor ? editor.getHTML() : 'Editor not initialized');
    }
  }, [currentPost, editor]);

  // Initialize or find post
  useEffect(() => {
    if (isNew) {
      if (!postInitializedRef.current) {
        const newPost = {
          id: Date.now(),
          title: '',
          excerpt: '',
          content: '',
          status: 'draft',
          coverImage: null,
          coverImageId: null, // NEW: Store cover image ID
          imageIds: []
        };
        dispatch(setCurrentPost(newPost));
        setPostTitle('');
        postInitializedRef.current = true;
        editorContentSetRef.current = false;
        setIsInitialized(false);
      }
    } else {
      const post = posts.find(p => p.id === parseInt(id));
      if (post) {
        if (!postInitializedRef.current) {
          const postWithImageIds = {
            ...post,
            imageIds: post.imageIds || [],
            coverImageId: post.coverImageId || null
          };
          dispatch(setCurrentPost(postWithImageIds));
          setPostTitle(post.title);
          postInitializedRef.current = true;
          editorContentSetRef.current = false;
          setIsInitialized(false);
        }
      } else {
        navigate('/');
      }
    }
  }, [id, isNew, navigate, dispatch]);

  // Reset initialization when route changes
  useEffect(() => {
    postInitializedRef.current = false;
    editorContentSetRef.current = false;
    editorReadyRef.current = false; // FIXED: Reset editor ready flag too
  }, [id]);

  // UPDATED: Set initial content with HTML embed restoration
  useEffect(() => {
    // Only proceed if editor is ready, we have a current post, and content hasn't been set
    if (!editorReadyRef.current || !currentPost || editorContentSetRef.current) {
      return;
    }

    let postContent = currentPost.content || '';
    
    // NEW: Restore media (images + YouTube + HTML) from localStorage if we have mediaIds
    if (currentPost.imageIds && currentPost.imageIds.length > 0) {
      currentPost.imageIds.forEach(mediaId => {
        try {
          const mediaData = localStorage.getItem(`blog-image-${mediaId}`);
          if (mediaData) {
            const parsedMediaData = JSON.parse(mediaData);
            
            // Handle different media types
            if (parsedMediaData.type === 'youtube') {
              // Parse the HTML content to find and update YouTube embeds
              const parser = new DOMParser();
              const doc = parser.parseFromString(postContent, 'text/html');
              
              // Look for YouTube embeds by data attributes or video ID
              const youtubeContainers = doc.querySelectorAll(`div[data-media-id="${mediaId}"], div[data-youtube-id="${mediaId}"]`);
              const youtubeIframes = doc.querySelectorAll(`iframe[data-youtube-id="${mediaId}"]`);
              
              if (youtubeContainers.length === 0 && youtubeIframes.length === 0) {
                // YouTube embed not found in content, but we have the data - recreate it
                const embedHTML = `
                  <div class="video-embed my-6" data-media-id="${mediaId}" data-media-type="youtube" data-youtube-id="${mediaId}">
                    <div class="relative w-full h-0 pb-[56.25%]">
                      <iframe 
                        src="https://www.youtube.com/embed/${parsedMediaData.videoId}" 
                        title="YouTube video player"
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                        class="absolute top-0 left-0 w-full h-full rounded-lg"
                        data-youtube-id="${mediaId}"
                      ></iframe>
                    </div>
                  </div>
                `;
                
                // Append to content (you might want to insert at specific position)
                postContent += embedHTML;
              } else {
                // Update existing YouTube embeds with proper data attributes
                youtubeContainers.forEach(container => {
                  container.setAttribute('data-media-id', mediaId);
                  container.setAttribute('data-media-type', 'youtube');
                  container.setAttribute('data-youtube-id', mediaId);
                });
                
                youtubeIframes.forEach(iframe => {
                  iframe.setAttribute('data-youtube-id', mediaId);
                  // Ensure iframe has correct src
                  iframe.src = `https://www.youtube.com/embed/${parsedMediaData.videoId}`;
                });
                
                // Update postContent with the modified HTML
                postContent = doc.body.innerHTML;
              }
            } else if (parsedMediaData.type === 'html') {
              // Parse the HTML content to find and update HTML embeds
              const parser = new DOMParser();
              const doc = parser.parseFromString(postContent, 'text/html');
              
              // Look for HTML embeds by data attributes
              const htmlContainers = doc.querySelectorAll(`div[data-media-id="${mediaId}"]`);
              
              if (htmlContainers.length === 0) {
                // HTML embed not found in content, but we have the data - recreate it
                const wrappedHTML = `<div data-raw-html="true" data-media-id="${mediaId}" data-media-type="html" data-html-content="${parsedMediaData.htmlContent.replace(/"/g, '&quot;')}">${parsedMediaData.htmlContent}</div>`;
                
                // Append to content (you might want to insert at specific position)
                postContent += wrappedHTML;
              } else {
                // Update existing HTML embeds with proper data attributes
                htmlContainers.forEach(container => {
                  container.setAttribute('data-media-id', mediaId);
                  container.setAttribute('data-media-type', 'html');
                  container.setAttribute('data-raw-html', 'true');
                  container.setAttribute('data-html-content', parsedMediaData.htmlContent.replace(/"/g, '&quot;'));
                  // Update the inner HTML content
                  container.innerHTML = parsedMediaData.htmlContent;
                });
                
                // Update postContent with the modified HTML
                postContent = doc.body.innerHTML;
              }
            } else {
              // Handle regular images (existing logic)
              if (postContent.includes(parsedMediaData.data)) {
                // Parse the HTML content
                const parser = new DOMParser();
                const doc = parser.parseFromString(postContent, 'text/html');
                const images = doc.querySelectorAll('img');
                
                // Find and update the matching image
                images.forEach(img => {
                  if (img.src === parsedMediaData.data) {
                    // Add the data attributes to this image
                    img.setAttribute('data-image-id', mediaId);
                    img.setAttribute('data-image-name', parsedMediaData.name);
                    img.setAttribute('data-stored-id', mediaId);
                  }
                });
                
                // Update postContent with the modified HTML
                postContent = doc.body.innerHTML;
              }
            }
          } else {
            console.warn('Media not found in localStorage:', mediaId);
          }
        } catch (error) {
          console.error('Error restoring media:', mediaId, error);
        }
      });
    }
    
    // NEW: Restore cover image from localStorage if we have coverImageId
    if (currentPost.coverImageId) {
      try {
        const coverImageData = localStorage.getItem(`blog-image-${currentPost.coverImageId}`);
        if (coverImageData) {
          const parsedCoverImageData = JSON.parse(coverImageData);
          setCoverImage(parsedCoverImageData.data);
        } else {
          console.warn('Cover image not found in localStorage:', currentPost.coverImageId);
          // Fallback to original cover image if exists
          if (currentPost.coverImage) {
            setCoverImage(currentPost.coverImage);
          }
        }
      } catch (error) {
        console.error('Error restoring cover image:', currentPost.coverImageId, error);
        // Fallback to original cover image if exists
        if (currentPost.coverImage) {
          setCoverImage(currentPost.coverImage);
        }
      }
    } else if (currentPost.coverImage) {
      // Fallback for posts without coverImageId
      setCoverImage(currentPost.coverImage);
    }

    const setContentSafely = () => {
      try {
        if (editor && editor.commands && editor.view && editor.view.dom) {
          editor.commands.setContent(postContent);
          editorContentSetRef.current = true;
          setIsInitialized(true);
          setHasInitialContent(true);
          
          setTimeout(() => {
            const editorHTML = editor.getHTML();
            const testExtraction = extractImageIds(editorHTML);
            
            if (editor.view && editor.view.dom && editor.view.editable) {
              triggerSelectionCheck();
            }
          }, 100);
          
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error setting content:', error);
        return false;
      }
    };

    if (!setContentSafely()) {
      setTimeout(() => {
        if (!editorContentSetRef.current) {
          setContentSafely();
        }
      }, 200);
    }
    
    if (currentPost.coverImage) {
      setCoverImage(currentPost.coverImage);
    }
  }, [currentPost, editor, editorReadyRef.current]);

  // Debug effect to track what's happening
  useEffect(() => {
    if (currentPost) {
      // Removed debug console.log
    }
  }, [currentPost]);

  // Cleanup global callbacks with proper cleanup
  useEffect(() => {
    return () => {
      if (window.storeYouTubeMedia) {
        window.storeYouTubeMedia = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (autosaveRef.current && autosaveRef.current.cancel) {
        autosaveRef.current.cancel();
      }
    };
  }, []);

  // Add global style injection for HTML embeds
  useEffect(() => {
    // Inject global CSS for HTML embeds
    const styleId = 'html-embed-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .html-embed-content * {
          all: unset !important;
          display: revert !important;
          color: revert !important;
          font-family: inherit !important;
          font-size: revert !important;
          font-weight: revert !important;
          text-decoration: revert !important;
          margin: revert !important;
          padding: revert !important;
          background: revert !important;
          border: revert !important;
        }
        .html-embed-content p {
          display: block !important;
          margin: 1em 0 !important;
        }
        .html-embed-content div {
          display: block !important;
        }
        .html-embed-content span {
          display: inline !important;
        }
        .html-embed-content h1, .html-embed-content h2, .html-embed-content h3,
        .html-embed-content h4, .html-embed-content h5, .html-embed-content h6 {
          display: block !important;
          font-weight: bold !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Cleanup
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  // Add these handlers for the HTML modal
  const openHtmlModal = (onSubmit) => {
    setHtmlModal({
      isOpen: true,
      error: null,
      onSubmit,
    });
  };

  const closeHtmlModal = () => {
    setHtmlModal(prev => ({ ...prev, isOpen: false, error: null, onSubmit: null }));
  };

  const handleHtmlModalSubmit = (htmlValue) => {
    if (!htmlValue || !htmlValue.trim()) {
      setHtmlModal(prev => ({ ...prev, error: 'HTML code cannot be empty' }));
      return;
    }
    if (htmlModal.onSubmit) {
      htmlModal.onSubmit(htmlValue);
    }
    closeHtmlModal();
  };

  if (!currentPost) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-w-screen min-h-screen pt-8 sm:pt-4 px-4 sm:px-8 lg:px-20 overflow-scroll font-sans">
      {/* Header */}
      <div className="flex items-center justify-between backdrop-blur-sm p-2 sm:p-4 sticky top-0 z-10">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-1 sm:space-x-2 text-gray-500 cursor-pointer hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={16} />
            <span className='text-black font-medium text-sm sm:text-base'>Posts</span>
          </button>
          <span className="text-gray-400 text-xs sm:text-sm">
            {lastSaved ? 'Draft - Saved' : 'Draft'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3">
          <PanelRight 
            size={14}
            className="text-gray-500 cursor-pointer hover:text-gray-900 transition-colors hidden sm:block"
          />
          <button className="px-2 sm:px-3 py-1.5 sm:py-2 bg-black text-white cursor-pointer rounded-lg hover:bg-gray-900 transition-colors font-medium font-inter text-sm">
            Preview
          </button>
          <button 
            onClick={publishPost}
            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-green-600 text-white cursor-pointer rounded-lg hover:bg-green-600/80 transition-colors font-medium font-inter border border-green-600 text-sm"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Cover Image Upload */}
        <div className="p-4 sm:p-6 lg:p-8 -mt-2 sm:-mt-4">
          <div 
            className="border-2 border-dashed bg-white border-gray-300 rounded-lg p-8 sm:p-16 lg:p-25 text-center hover:border-green-400 transition-colors cursor-pointer group relative"
            onClick={handleCoverImageClick}
            onDrop={handleCoverImageDrop}
            onDragOver={handleCoverImageDragOver}
          >
            {coverImage ? (
              <div className="relative">
                <img 
                  src={coverImage} 
                  alt="Cover" 
                  className="w-full h-auto object-cover rounded-lg"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <VscCloudUpload size={20} className="sm:w-6 sm:h-6 text-gray-500 group-hover:text-green-500 mb-2 sm:mb-4 transition-colors" />
                <p className="text-gray-500 font-medium text-sm sm:text-base">
                  Click to upload post cover
                  <span className="text-gray-400 font-normal ml-1 hidden sm:inline">or drag and drop</span>
                </p>
                <p className="text-xs text-gray-400 mt-1 sm:mt-2">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="mx-4 sm:mx-8 lg:mx-14 pb-3 sm:pb-5 border-b border-gray-300">
          <input
            type="text"
            value={postTitle}
            onChange={handleTitleChange}
            className="w-full text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none leading-tight"
            placeholder="Post title"
          />
        </div>

        {/* Editor */}
        <div className="relative mx-2 sm:mx-4 lg:mx-6 mt-4 sm:mt-6 font-serif" ref={editorRef}>
          <EditorContent editor={editor} />
          
          <FloatingPlusMenu
            editor={editor}
            isVisible={plusMenuVisible && !isTyping}
            position={plusMenuPosition}
            onInsert={handleMediaInsert}
            openModal={openModal}
            showHtmlModal={openHtmlModal}
          />
          
          <FloatingToolbar
            editor={editor}
            isVisible={toolbarVisible && !isTyping}
            position={toolbarPosition}
            openModal={openModal}
          />
        </div>
      </div>

      {/* Custom Modal */}
      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        placeholder={modalConfig.placeholder}
        type={modalConfig.type}
        error={modalConfig.error}
        onSubmit={handleModalSubmit}
      />

      {/* Bookmark Modal */}
      <BookmarkModal
        isOpen={bookmarkModal.isOpen}
        onClose={closeBookmarkModal}
        onSubmit={handleBookmarkSubmit}
        error={bookmarkModal.error}
      />

      {/* HTML Input Modal */}
      <HtmlInputModal
        isOpen={htmlModal.isOpen}
        onClose={closeHtmlModal}
        onSubmit={handleHtmlModalSubmit}
        error={htmlModal.error}
      />
    </div>
  );
};

export default BlogEditor;