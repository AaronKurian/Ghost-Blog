import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { store } from '../store/store';
import { useDispatch, useSelector } from 'react-redux';
import { setPosts } from '../store/postsSlice';
import PostsList from './PostsList';
import BlogEditor from './BlogEditor';

const AppContent = () => {
  const dispatch = useDispatch();
  const posts = useSelector(state => state.posts.posts);

  useEffect(() => {
    const savedPosts = localStorage.getItem('ghostBlogPosts');
    if (savedPosts) {
      try {
        dispatch(setPosts(JSON.parse(savedPosts)));
      } catch (error) {
        console.error('Error parsing saved posts:', error);
        dispatch(setPosts([]));
      }
    }
  }, [dispatch]);

  useEffect(() => {
    localStorage.setItem('ghostBlogPosts', JSON.stringify(posts));
  }, [posts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <Routes>
          <Route path="/" element={<PostsList />} />
          <Route path="/editor/:id" element={<BlogEditor />} />
        </Routes>
      </Router>
    </div>
  );
};

const GhostBlogEditor = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default GhostBlogEditor;
      
   