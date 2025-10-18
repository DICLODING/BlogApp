import axios from 'axios';

// Define the Comment type
export interface Comment {
  id: number;
  postId: number;
  author: string;
  content: string;
  date: string;
}

// Define the Post type
export interface Post {
  id: number;
  title: string;
  author: string;
  date: string;
  category: string;
  content?: string;
  likes?: number;
  comments?: number;
  status?: 'published' | 'draft';
  userId?: number;
  commentsList?: Comment[];
}

const api = axios.create({
  baseURL: 'https://dummyjson.com',
});

// API functions for posts
export const postsApi = {
  // Get all posts
  getPosts: async (): Promise<Post[]> => {
    const response = await api.get('/posts');
    return response.data.posts;
  },

  // Get single post
  getPost: async (id: number): Promise<Post> => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  // Create new post
  createPost: async (post: Omit<Post, 'id'>): Promise<Post> => {
    const response = await api.post('/posts/add', {
      title: post.title,
      body: post.content,
      userId: post.userId || 1,
    });
    return {
      ...response.data,
      author: post.author,
      date: post.date,
      category: post.category,
      content: post.content,
      likes: post.likes || 0,
      comments: post.comments || 0,
      status: post.status || 'published',
    };
  },

  // Update post
  updatePost: async (id: number, post: Partial<Post>): Promise<Post> => {
    const response = await api.put(`/posts/${id}`, {
      title: post.title,
      body: post.content,
    });
    return {
      ...response.data,
      author: post.author,
      date: post.date,
      category: post.category,
      content: post.content,
      likes: post.likes,
      comments: post.comments,
      status: post.status,
    };
  },

  // Delete post
  deletePost: async (id: number): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },

  // Get comments for a post
  getComments: async (postId: number): Promise<Comment[]> => {
    const response = await api.get(`/posts/${postId}/comments`);
    return response.data.comments;
  },

  // Add a comment to a post
  addComment: async (postId: number, comment: Omit<Comment, 'id' | 'postId' | 'date'>): Promise<Comment> => {
    const response = await api.post(`/posts/${postId}/comments/add`, {
      body: comment.content,
      userId: 1, // Assuming user ID
      postId,
    });
    return {
      ...response.data,
      postId,
      author: comment.author,
      content: comment.content,
      date: new Date().toISOString().split('T')[0],
    };
  },
};

export default api;
