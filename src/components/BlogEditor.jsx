import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEditor, EditorContent } from '@tiptap/react';
import { Node } from '@tiptap/core';
import { throttle } from 'throttle-debounce';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { addPost, updatePost, setCurrentPost, setLastSaved } from '../store/postsSlice';
import { BookmarkExtension } from '../extensions/BookmarkExtension';
import { RawHTMLExtension } from '../extensions/RawHTMLExtension';
import { fetchMetadata } from '../utils/metadataFetcher';
import FloatingToolbar from './FloatingToolbar';
import FloatingPlusMenu from './FloatingPlusMenu';
import { AiOutlineCloudUpload } from "react-icons/ai";
import { ChevronLeft, PanelRight } from 'lucide-react';

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
  
  const editorRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const autosaveRef = useRef(null);
  const postInitializedRef = useRef(false);
  const editorContentSetRef = useRef(false); // Track if editor content has been set

  // Initialize or find post
  useEffect(() => {
    if (isNew) {
      if (!postInitializedRef.current) {
        const newPost = {
          id: Date.now(),
          title: '',
          excerpt: '',
          content: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
          coverImage: null,
          author: 'Admin',
          readTime: '1 min read',
          tags: []
        };
        dispatch(setCurrentPost(newPost));
        setPostTitle('');
        postInitializedRef.current = true;
        editorContentSetRef.current = false; // Reset for new post
        setIsInitialized(false);
      }
    } else {
      const post = posts.find(p => p.id === parseInt(id));
      if (post) {
        if (!postInitializedRef.current) {
          dispatch(setCurrentPost(post));
          setPostTitle(post.title);
          postInitializedRef.current = true;
          editorContentSetRef.current = false; // Reset for existing post
          setIsInitialized(false);
        }
      } else {
        navigate('/');
      }
    }
  }, [id, isNew, posts, navigate, dispatch]);

  // Reset initialization when route changes
  useEffect(() => {
    postInitializedRef.current = false;
    editorContentSetRef.current = false;
  }, [id]);

  // Autosave function - NO setCurrentPost calls to prevent re-renders
  const autosave = throttle(2000, (title, content) => {
    if (currentPost && editor && isInitialized) {
      const excerpt = editor.getText().substring(0, 160);
      const finalExcerpt = excerpt.length > 0 ? excerpt + '...' : '';
      
      const updatedPost = {
        ...currentPost,
        title: title || 'Untitled Post',
        content,
        excerpt: finalExcerpt,
        updatedAt: new Date().toISOString()
      };
      
      const hasRealContent = title.trim().length > 0 || editor.getText().trim().length > 0;
      
      if (isNew) {
        if (hasRealContent) {
          const existingPost = posts.find(p => p.id === currentPost.id);
          if (!existingPost) {
            // Mark that we're adding the post to prevent content reset
            const currentContentSet = editorContentSetRef.current;
            dispatch(addPost(updatedPost));
            // Restore the content set flag immediately after dispatch
            editorContentSetRef.current = currentContentSet;
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

  // Handle selection change - fixed positioning logic
  const handleSelectionChange = (editor) => {
    if (!editor) return;
    
    try {
      const { selection } = editor.state;
      const { from, to } = selection;
      
      if (from === to) {
        // Cursor position - check if current line has content
        const $from = selection.$from;
        const currentLineText = $from.parent.textContent || '';
        const hasContentOnLine = currentLineText.trim().length > 0;
        
        // Show plus menu if current line is empty or only whitespace
        if (!hasContentOnLine) {
          const coords = editor.view.coordsAtPos(from);
          const editorElement = editor.view.dom;
          const editorRect = editorElement.getBoundingClientRect();
          
          // Get the container element for proper positioning
          const containerElement = editorRef.current;
          const containerRect = containerElement ? containerElement.getBoundingClientRect() : { left: 0, top: 0 };
          
          // Position relative to the editor container, not the viewport
          setPlusMenuPosition({
            x: editorRect.left - containerRect.left - 10, // Position to the left of editor content
            y: coords.top - containerRect.top // Align with cursor line
          });
          setPlusMenuVisible(true);
          setToolbarVisible(false);
        } else {
          // Hide plus menu if line has content
          setPlusMenuVisible(false);
          setToolbarVisible(false);
        }
      } else {
        // Text selection - show toolbar (use viewport coordinates for fixed positioning)
        const coords = editor.view.coordsAtPos(from);
        
        setToolbarPosition({
          x: coords.left, // Keep viewport coordinates for toolbar
          y: coords.top - 50 // Position above the selection
        });
        setToolbarVisible(true);
        setPlusMenuVisible(false);
      }
    } catch (error) {
      console.error('Error in handleSelectionChange:', error);
      setPlusMenuVisible(false);
      setToolbarVisible(false);
    }
  };

  // Enhanced selection handling that triggers on various events
  const triggerSelectionCheck = () => {
    if (editor) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        handleSelectionChange(editor);
      }, 10);
    }
  };

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
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
      }),
      Underline,
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
        setIsInitialized(true);
        triggerSelectionCheck();
      }, 100);
    },
  });

  // Add scroll event listener to update positions
  useEffect(() => {
    const handleScroll = () => {
      if (editor && !isTyping) {
        // Update positions on scroll
        setTimeout(() => triggerSelectionCheck(), 10);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [editor, isTyping]);

  // Add resize event listener
  useEffect(() => {
    const handleResize = () => {
      if (editor && !isTyping) {
        setTimeout(() => triggerSelectionCheck(), 10);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [editor, isTyping]);

  // Handle media insertion
  const handleMediaInsert = async (type, data) => {
    if (!editor) return;
    
    editor.commands.focus();
    
    switch (type) {
      case 'image':
        if (data?.src) {
          editor.chain().focus().setImage({ src: data.src }).run();
        }
        break;
      case 'youtube':
        // Insert YouTube input textbox directly in the editor
        const youtubeInputHTML = `
          <div class="youtube-input-wrapper" style="border: 2px dashed #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; background-color: #f9fafb;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg style="width: 20px; height: 20px; color: #ef4444;" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
              <input 
                type="text" 
                placeholder="Paste YouTube URL and press Enter" 
                class="youtube-url-input"
                style="flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none;"
                onkeydown="if(event.key === 'Enter') { 
                  event.preventDefault(); 
                  const url = this.value.trim();
                  if (url) {
                    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w\-]{11})/);
                    if (videoId) {
                      const embedHTML = \`<div class='video-embed my-6'><div class='relative w-full h-0 pb-[56.25%]'><iframe src='https://www.youtube.com/embed/\${videoId[1]}' frameborder='0' allowfullscreen class='absolute top-0 left-0 w-full h-full rounded-lg'></iframe></div></div>\`;
                      this.parentElement.parentElement.outerHTML = embedHTML;
                    } else {
                      alert('Invalid YouTube URL. Please enter a valid YouTube video URL.');
                    }
                  } else {
                    this.parentElement.parentElement.remove();
                  }
                }"
                autofocus
              />
            </div>
            <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
              Paste a YouTube link and press Enter, or press Enter with empty field to cancel
            </div>
          </div>
        `;
        editor.commands.insertContent(youtubeInputHTML, {
          parseOptions: {
            preserveWhitespace: 'full',
          },
        });
        
        // Focus on the input field after insertion
        setTimeout(() => {
          const input = document.querySelector('.youtube-url-input');
          if (input) {
            input.focus();
          }
        }, 100);
        break;
      case 'html':
      case 'rawhtml':
        if (data) {
          console.log('Inserting HTML:', data);
          
          // Wrap the HTML in a div with data-raw-html attribute and store content in data attribute
          const wrappedHTML = `<div data-raw-html="true" data-html-content="${data.replace(/"/g, '&quot;')}"></div>`;
          
          editor.commands.insertContent(wrappedHTML, {
            parseOptions: {
              preserveWhitespace: 'full',
            },
          });
        }
        break;
      case 'bookmark':
        if (data?.url) {
          try {
            // Try to use BookmarkExtension if available
            if (editor.commands.setBookmark) {
              const metadata = await fetchMetadata(data.url);
              editor.chain().focus().setBookmark(metadata).run();
            } else {
              // Fallback to HTML insertion if BookmarkExtension is not available
              const bookmarkHTML = `
                <div class="bookmark-card border rounded-lg p-4 my-4 bg-gray-50">
                  <a href="${data.url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800">
                    <h4 class="font-semibold mb-2">Bookmark</h4>
                    <p class="text-sm text-gray-600">${data.url}</p>
                  </a>
                </div>
              `;
              editor.commands.insertContent(bookmarkHTML, {
                parseOptions: {
                  preserveWhitespace: 'full',
                },
              });
            }
          } catch (error) {
            console.error('Error creating bookmark:', error);
            // Fallback to simple HTML
            const bookmarkHTML = `
              <div class="bookmark-card border rounded-lg p-4 my-4 bg-gray-50">
                <a href="${data.url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800">
                  <h4 class="font-semibold mb-2">Bookmark</h4>
                  <p class="text-sm text-gray-600">${data.url}</p>
                </a>
              </div>
            `;
            editor.commands.insertContent(bookmarkHTML, {
              parseOptions: {
                preserveWhitespace: 'full',
              },
            });
          }
        }
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

  // Enhanced publish post function
  const publishPost = () => {
    if (currentPost && editor) {
      const finalTitle = postTitle.trim() || 'Untitled Post';
      const content = editor.getHTML();
      const excerpt = editor.getText().substring(0, 160);
      const finalExcerpt = excerpt.length > 0 ? excerpt + '...' : '';
      
      const publishedPost = {
        ...currentPost,
        title: finalTitle,
        content,
        excerpt: finalExcerpt,
        status: 'published',
        updatedAt: new Date().toISOString()
      };
      
      // Always update/add the post when publishing
      const existingPost = posts.find(p => p.id === currentPost.id);
      if (!existingPost) {
        dispatch(addPost(publishedPost));
        console.log('Published new post:', publishedPost.title);
      } else {
        dispatch(updatePost(publishedPost));
        console.log('Published existing post:', publishedPost.title);
      }
      
      dispatch(setLastSaved(new Date().toISOString()));
      
      // Navigate back to posts list after publishing
      navigate('/');
    }
  };

  // // Publish post
  // const publishPost = () => {
  //   if (currentPost && editor) {
  //     const publishedPost = {
  //       ...currentPost,
  //       title: postTitle,
  //       content: editor.getHTML(),
  //       excerpt: editor.getText().substring(0, 160) + '...',
  //       status: 'published',
  //       updatedAt: new Date().toISOString()
  //     };
      
  //     if (isNew) {
  //       dispatch(addPost(publishedPost));
  //     } else {
  //       dispatch(updatePost(publishedPost));
  //     }
  //   }
  // };

  // Handle cover image upload - Remove setCurrentPost to prevent re-renders
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
      reader.onload = (e) => {
        setCoverImage(e.target.result);
        // DON'T call setCurrentPost here - it causes re-renders
      };
      reader.readAsDataURL(file);
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

  // Remove cover image - No setCurrentPost calls
  const handleRemoveCoverImage = () => {
    setCoverImage(null);
    // DON'T call setCurrentPost here - it causes re-renders
  };

  // Set initial content ONLY ONCE when editor is ready
  useEffect(() => {
    console.log('Content init check:', {
      hasEditor: !!editor,
      hasCurrentPost: !!currentPost,
      editorContentSet: editorContentSetRef.current,
      postId: currentPost?.id,
      contentExists: !!(currentPost?.content),
      contentLength: currentPost?.content?.length || 0
    });

    if (editor && currentPost && !editorContentSetRef.current) {
      const postContent = currentPost.content || '';
      
      console.log('Setting content for post:', currentPost.id, 'Content:', postContent.substring(0, 100));
      
      // Use setTimeout to ensure editor is fully ready
      setTimeout(() => {
        editor.commands.setContent(postContent);
        editorContentSetRef.current = true;
        setIsInitialized(true);
        setHasInitialContent(true);
        
        console.log('✅ Content set successfully');
      }, 50);
      
      // Set cover image if it exists
      if (currentPost.coverImage) {
        setCoverImage(currentPost.coverImage);
      }
    }
  }, [currentPost, editor]);

  // Debug effect to track what's happening
  useEffect(() => {
    if (currentPost) {
      console.log('📝 Current post changed:', {
        id: currentPost.id,
        title: currentPost.title,
        hasContent: !!(currentPost.content),
        contentPreview: currentPost.content?.substring(0, 50) + '...'
      });
    }
  }, [currentPost]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (autosaveRef.current) {
        autosaveRef.current.cancel();
      }
    };
  }, [editor]);

  if (!currentPost) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-w-screen min-h-screen pt-4 px-20 overflow-scroll">
      {/* Header */}
      <div className="flex items-center justify-between backdrop-blur-sm p-4 sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-500 cursor-pointer hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={16} />
            <span className='text-black font-medium'>Posts</span>
          </button>
          <span className="text-gray-400">
            {lastSaved ? `Saved ${new Date(lastSaved).toLocaleTimeString()}` : 'Draft'}
          </span>
        </div>
        
        <div className="flex items-center space-x-3 -mr-3">
          <PanelRight 
            size={14}
            className="text-gray-500 cursor-pointer hover:text-gray-900 transition-colors mr-6"
          />
          <button className="px-3 py-2 bg-black text-white cursor-pointer rounded-lg hover:bg-gray-900 transition-colors font-medium">
            Preview
          </button>
          <button 
            onClick={publishPost}
            className="px-3 py-2 bg-green-600 text-white cursor-pointer rounded-lg hover:bg-green-600/80 transition-colors font-medium border border-green-600"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="max-w-[53rem] mx-auto">
        {/* Cover Image Upload */}
        <div className="p-8 -mt-4">
          <div 
            className="border-2 border-dashed bg-white border-gray-300 rounded-lg p-25 text-center hover:border-green-400 transition-colors cursor-pointer group relative"
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
                <AiOutlineCloudUpload size={24} className="text-gray-500 group-hover:text-green-500 mb-4 transition-colors" />
                <p className="text-gray-500 font-medium">Click to upload post cover
                <span className=" text-gray-400 font-normal ml-1">or drag and drop</span></p>
                <p className="text-xs text-gray-400 mt-2">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="mx-14 pb-5 border-b border-gray-300">
          <input
            type="text"
            value={postTitle}
            onChange={handleTitleChange}
            className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none leading-tight"
            placeholder="Post title"
          />
        </div>

        {/* Editor */}
        <div className="relative mx-6 mt-6" ref={editorRef}>
          <EditorContent editor={editor} />
          
          <FloatingPlusMenu
            editor={editor}
            isVisible={plusMenuVisible && !isTyping}
            position={plusMenuPosition}
            onInsert={handleMediaInsert}
          />
          
          <FloatingToolbar
            editor={editor}
            isVisible={toolbarVisible && !isTyping}
            position={toolbarPosition}
          />
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;