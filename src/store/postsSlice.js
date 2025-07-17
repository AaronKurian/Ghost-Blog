import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  posts: [],
  currentPost: null,
  isLoading: false,
  lastSaved: null,
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setPosts: (state, action) => {
      state.posts = action.payload;
    },
    addPost: (state, action) => {
      const newPost = {
        ...action.payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageIds: action.payload.imageIds || []
      };
      state.posts.unshift(newPost);
    },
    updatePost: (state, action) => {
      const index = state.posts.findIndex(post => post.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = {
          ...action.payload,
          updatedAt: new Date().toISOString(),
          imageIds: action.payload.imageIds || []
        };
      }
    },
    deletePost: (state, action) => {
      state.posts = state.posts.filter(post => post.id !== action.payload);
    },
    setCurrentPost: (state, action) => {
      state.currentPost = action.payload ? {
        ...action.payload,
        imageIds: action.payload.imageIds || []
      } : null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setLastSaved: (state, action) => {
      state.lastSaved = action.payload;
    },
  },
});

export const {
  setPosts,
  addPost,
  updatePost,
  deletePost,
  setCurrentPost,
  setLoading,
  setLastSaved,
} = postsSlice.actions;

export default postsSlice.reducer;
