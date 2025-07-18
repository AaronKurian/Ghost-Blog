import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { deletePost } from '../store/postsSlice';
import {
  Search,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Unknown';
  
  const now = new Date();
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return 'Unknown';
  
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins} minutes ago`;
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const PostsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    postId: null,
    postTitle: ''
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const posts = useSelector(state => state.posts.posts);

  // Filter posts based on search - FIXED to handle undefined tags
  const filteredPosts = posts.filter(post => {
    const title = post.title || '';
    const excerpt = post.excerpt || '';
    const content = post.content || '';
    const tags = post.tags || []; // Default to empty array if undefined
    
    return (
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleCreateNew = () => {
    navigate('/editor/new');
  };

  const handleEditPost = (postId) => {
    navigate(`/editor/${postId}`);
  };

  const handleDeletePost = (postId) => {
    const post = posts.find(p => p.id === postId);
    setDeleteModal({
      isOpen: true,
      postId: postId,
      postTitle: post ? post.title : 'Untitled Post'
    });
  };

  const confirmDelete = () => {
    if (deleteModal.postId) {
      dispatch(deletePost(deleteModal.postId));
    }
    setDeleteModal({
      isOpen: false,
      postId: null,
      postTitle: ''
    });
  };

  const cancelDelete = () => {
    setDeleteModal({
      isOpen: false,
      postId: null,
      postTitle: ''
    });
  };

  return (
    <div className="min-w-screen min-h-screen p-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
      </div>

      <div className="mb-12 text-gray-500">
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-lg flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500/90" size={20} />
            <input
              type="text"
              placeholder="Search Posts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-[1.2px] border-gray-300 placeholder-gray-600/80 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent shadow-sm transition-shadow duration-200 ease-in-out"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <button
            onClick={handleCreateNew}
            className="bg-black text-white px-4 py-2 rounded-xl cursor-pointer hover:bg-gray-900 transition-colors font-semibold text-lg flex items-center space-x-2 whitespace-nowrap"
          >
            <span>New post</span>
          </button>
        </div>
      </div>

      <div className="w-full h-px bg-gray-300"></div>

      <div className="grid">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <div key={post.id} className="border-b border-gray-300 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 
                    className="text-xl font-semibold text-black cursor-pointer mb-1 " 
                    onClick={() => handleEditPost(post.id)}
                  >
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-500 leading-relaxed font-medium font-sans mb-1 overflow-hidden text-ellipsis whitespace-nowrap max-w-[10rem] sm:max-w-[20rem] md:max-w-[30rem] lg:max-w-[44rem]">
                    {post.content ? post.content.replace(/<[^>]*>/g, '') : 'No content available'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500 font-sans">
                      <span>{formatRelativeTime(post.updatedAt || post.createdAt || new Date().toISOString())}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-7 ml-4 self-center">
                  <button
                    onClick={() => handleEditPost(post.id)}
                    className="p-2 text-gray-500/80 hover:text-green-600 font-light transition-colors"
                    title="Edit post"
                  >
                    <Pencil size={24} />
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                    title="Delete post"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {posts.length === 0 ? 'No posts yet' : 'No posts found'}
            </h3>
            <p className="text-gray-500 mb-4">
              {posts.length === 0 
                ? 'Create your first post to get started.' 
                : 'Try adjusting your search terms.'
              }
            </p>
            {posts.length === 0 && (
              <button
                onClick={handleCreateNew}
                className="bg-black text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-gray-900 transition-colors font-medium"
              >
                Create your first post
              </button>
            )}
          </div>
        )}
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        postTitle={deleteModal.postTitle}
      />
    </div>
  );
};

export default PostsList;
