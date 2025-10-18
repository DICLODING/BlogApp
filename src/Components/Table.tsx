import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Comment } from '../lib/api'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../store'
import {
  fetchPosts,
  createPost,
  updatePost,
  deletePost,
  setCurrentPost,
  fetchComments,
  addComment
} from '../store/postsSlice'
import type { Post } from '../lib/api'

// Available categories
const categories = ['Frontend', 'Backend', 'TypeScript', 'JavaScript', 'CSS', 'Tools', 'DevOps', 'Other']

function BlogTable() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { posts, loading, currentPost: reduxCurrentPost } = useSelector((state: RootState) => state.posts)

  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const [commentContent, setCommentContent] = useState('')
  const [comments, setComments] = useState<Comment[]>([])

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState('Frontend')
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published')

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken')
    const loggedIn = localStorage.getItem('LoggedIn') === 'true'

    if (token && loggedIn) {
      // Fetch posts from API
      dispatch(fetchPosts())
    } else {
      // Redirect to login if not logged in
      navigate('/')
    }
  }, [navigate, dispatch])

  // Handle click outside modal to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('LoggedIn')
    navigate('/')
  }

  const openCreateModal = () => {
    setIsEditing(false)
    dispatch(setCurrentPost(null))
    setFormTitle('')
    setFormContent('')
    setFormCategory('Frontend')
    setFormStatus('published')
    setShowModal(true)
  }

  const openEditModal = (post: Post) => {
    setIsEditing(true)
    dispatch(setCurrentPost(post))
    setFormTitle(post.title)
    setFormContent(post.content || '')
    setFormCategory(post.category)
    setFormStatus(post.status || 'published')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    dispatch(setCurrentPost(null))
  }

  const handleCreateOrUpdatePost = async () => {
    if (!formTitle.trim()) {
      setNotification({
        message: 'Please enter a title',
        type: 'error'
      })
      return
    }

    const currentDate = new Date().toISOString().split('T')[0]

    try {
      if (isEditing && reduxCurrentPost) {
        // Update existing post
        await dispatch(updatePost({
          id: reduxCurrentPost.id,
          postData: {
            title: formTitle,
            content: formContent,
            category: formCategory,
            status: formStatus,
            author: reduxCurrentPost.author,
            date: reduxCurrentPost.date,
            likes: reduxCurrentPost.likes,
            comments: reduxCurrentPost.comments
          }
        })).unwrap()
        setNotification({
          message: 'Post updated successfully!',
          type: 'success'
        })
      } else {
        // Create new post
        const newPostData = {
          title: formTitle,
          author: 'Mahesh Dubey', // Get from user profile in a real app
          date: currentDate,
          category: formCategory,
          content: formContent,
          likes: 0,
          comments: 0,
          status: formStatus as 'published' | 'draft'
        }

        await dispatch(createPost(newPostData)).unwrap()
        setNotification({
          message: 'Post created successfully!',
          type: 'success'
        })
      }

      closeModal()
    } catch (error) {
      setNotification({
        message: 'Failed to save post. Please try again.',
        type: 'error'
      })
    }
  }

  const handleDeletePost = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await dispatch(deletePost(id)).unwrap()
        setNotification({
          message: 'Post deleted successfully!',
          type: 'success'
        })
      } catch (error) {
        setNotification({
          message: 'Failed to delete post. Please try again.',
          type: 'error'
        })
      }
    }
  }

  const handleViewPost = async (post: Post) => {
    dispatch(setCurrentPost(post))
    setIsEditing(false)
    setCommentContent('')
    setShowModal(true)

    // Fetch comments for the post
    try {
      const result = await dispatch(fetchComments(post.id)).unwrap()
      setComments(result.comments)
    } catch (error) {
      setComments([])
    }
  }

  const handleAddComment = async () => {
    if (!commentContent.trim() || !reduxCurrentPost) return

    try {
      await dispatch(addComment({
        postId: reduxCurrentPost.id,
        comment: {
          author: 'Mahesh Dubey', // Get from user profile in a real app
          content: commentContent,
        }
      })).unwrap()
      setCommentContent('')
      setNotification({
        message: 'Comment added successfully!',
        type: 'success'
      })
    } catch (error) {
      setNotification({
        message: 'Failed to add comment. Please try again.',
        type: 'error'
      })
    }
  }

  // Filter posts based on search term and category
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = filterCategory === 'all' || filterCategory === '' || post.category === filterCategory

    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-500/20 to-purple-600/20 animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)] animate-pulse delay-1000"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,119,198,0.2),transparent_50%)] animate-pulse delay-2000"></div>

      {/* Header */}
      <header className="relative bg-black/20 backdrop-blur-xl shadow-2xl py-6 px-6 border-b border-white/10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-cyan-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 20a2 2 0 002-2V8a2 2 0 00-2-2h-5M8 12h8m-8 4h6" />
              </svg>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Blog Dashboard
              </h1>
              <p className="text-sm text-gray-400">Manage your creative content</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">MD</span>
              </div>
              <div>
                <p className="text-white font-medium">Mahesh Dubey</p>
                <p className="text-gray-400 text-sm">Content Creator</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium rounded-xl px-6 py-3 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center border border-white/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-grow container mx-auto px-6 py-8 overflow-hidden">
        <div className="bg-black/30 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-white/10">
          {/* Action Bar */}
          <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 p-8 border-b border-white/10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-grow">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Blog Posts</h2>
                    <p className="text-gray-400 text-sm">Create and manage your content</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center text-cyan-400">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></div>
                    {filteredPosts.length} posts
                  </span>
                  <span className="flex items-center text-purple-400">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
                    {posts.filter(p => p.status === 'published').length} published
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="relative group">
                  <Input
                    type="text"
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 w-full lg:w-64 transition-all duration-300 backdrop-blur-sm"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-4 top-3.5 group-focus-within:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="pl-4 pr-10 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm appearance-none">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all" className="text-white hover:bg-gray-700">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category} className="text-white hover:bg-gray-700">{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={openCreateModal}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-medium rounded-xl px-6 py-3 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center whitespace-nowrap border border-white/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Post
                </Button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="p-8 overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-400 border-t-transparent"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-purple-400 border-t-transparent animate-spin animation-delay-300"></div>
                </div>
                <p className="text-white text-lg font-medium">Loading your posts...</p>
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white/5 border-b border-white/10 hover:bg-white/5">
                      <TableHead className="py-4 px-6 text-left text-sm font-semibold text-white/80">ID</TableHead>
                      <TableHead className="py-4 px-6 text-left text-sm font-semibold text-white/80">Title</TableHead>
                      <TableHead className="py-4 px-6 text-left text-sm font-semibold text-white/80 hidden md:table-cell">Author</TableHead>
                      <TableHead className="py-4 px-6 text-left text-sm font-semibold text-white/80">Category</TableHead>
                      <TableHead className="py-4 px-6 text-left text-sm font-semibold text-white/80 hidden sm:table-cell">Date</TableHead>
                      <TableHead className="py-4 px-6 text-left text-sm font-semibold text-white/80 hidden lg:table-cell">Status</TableHead>
                      <TableHead className="py-4 px-6 text-left text-sm font-semibold text-white/80 hidden lg:table-cell">Stats</TableHead>
                      <TableHead className="py-4 px-6 text-left text-sm font-semibold text-white/80">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.map((post, index) => (
                      <TableRow key={post.id} className="border-b border-white/5 hover:bg-white/5 transition-all duration-300 group">
                        <TableCell className="py-4 px-6 text-white/90 font-mono">{post.id}</TableCell>
                        <TableCell className="py-4 px-6 text-white font-medium">
                          <div className="truncate max-w-[250px] group-hover:text-cyan-300 transition-colors">{post.title}</div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-white/70 hidden md:table-cell">{post.author}</TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge variant="secondary" className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-400/30">
                            {post.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-white/70 hidden sm:table-cell">{post.date}</TableCell>
                        <TableCell className="py-4 px-6 hidden lg:table-cell">
                          <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className={
                            post.status === 'published'
                              ? 'bg-green-500/20 text-green-300 border-green-400/30'
                              : 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
                          }>
                            {post.status || 'published'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-white/70 hidden lg:table-cell">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                              {post.likes || 0}
                            </span>
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                              </svg>
                              {post.comments || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleViewPost(post)}
                              variant="ghost"
                              size="icon"
                              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 bg-white/10"
                              title="View"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Button>
                            <Button
                              onClick={() => openEditModal(post)}
                              variant="ghost"
                              size="icon"
                              className="text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 bg-white/10"
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button
                              onClick={() => handleDeletePost(post.id)}
                              variant="ghost"
                              size="icon"
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 bg-white/10"
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="relative mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No blog posts found</h3>
                <p className="text-white/60 mb-6">Start creating amazing content for your audience</p>
                <Button
                  onClick={openCreateModal}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-medium rounded-xl px-8 py-4 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center mx-auto border border-white/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Post
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Notification */}
      {notification && (
        <Alert className={`fixed bottom-6 right-6 px-8 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl max-w-sm ${
          notification.type === 'success'
            ? 'bg-green-500/90 border-green-400/30 text-white'
            : 'bg-red-500/90 border-red-400/30 text-white'
        }`}>
          <div className={`w-3 h-3 rounded-full ${
            notification.type === 'success' ? 'bg-green-300' : 'bg-red-300'
          } animate-pulse mr-3`}></div>
          <AlertDescription className="flex items-center">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-white/70 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Modal for Create/Edit/View */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-black/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-white/20" aria-describedby="dialog-description">
          <div id="dialog-description" className="sr-only">
            {isEditing ? 'Edit existing blog post' : reduxCurrentPost ? 'View blog post details and comments' : 'Create a new blog post'}
          </div>
          <DialogHeader className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 p-6 border-b border-white/10 rounded-t-3xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-xl flex items-center justify-center">
                {isEditing ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ) : reduxCurrentPost ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </div>
              <DialogTitle className="text-2xl font-bold text-white">
                {isEditing ? 'Edit Post' : reduxCurrentPost ? 'View Post' : 'Create New Post'}
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="p-8">
            {reduxCurrentPost && !isEditing ? (
              // View mode
              <div className="space-y-6">
                <div className="border-b border-white/10 pb-6">
                  <h2 className="text-3xl font-bold text-white mb-4">{reduxCurrentPost.title}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center text-cyan-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {reduxCurrentPost.author}
                    </div>
                    <div className="flex items-center text-purple-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {reduxCurrentPost.date}
                    </div>
                    <Badge variant="secondary" className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-400/30">
                      {reduxCurrentPost.category}
                    </Badge>
                    {reduxCurrentPost.status && (
                      <Badge variant={reduxCurrentPost.status === 'published' ? 'default' : 'secondary'} className={
                        reduxCurrentPost.status === 'published'
                          ? 'bg-green-500/20 text-green-300 border-green-400/30'
                          : 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
                      }>
                        {reduxCurrentPost.status}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Content
                  </h3>
                  <div className="text-white/90 whitespace-pre-line leading-relaxed">
                    {reduxCurrentPost.content || 'No content available.'}
                  </div>
                </div>
                {(reduxCurrentPost.likes !== undefined || reduxCurrentPost.comments !== undefined) && (
                  <div className="flex items-center justify-center space-x-8 py-4">
                    {reduxCurrentPost.likes !== undefined && (
                      <div className="flex items-center space-x-2 text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{reduxCurrentPost.likes} likes</span>
                      </div>
                    )}
                    {reduxCurrentPost.comments !== undefined && (
                      <div className="flex items-center space-x-2 text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{reduxCurrentPost.comments} comments</span>
                      </div>
                    )}
                  </div>

                )}
              </div>
            ) : (
              // Create/Edit mode
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Title</label>
                  <Input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Enter post title"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Category</label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger className="w-full bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 rounded-lg">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {categories.map(category => (
                        <SelectItem key={category} value={category} className="text-white hover:bg-gray-700">{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Status</label>
                  <RadioGroup value={formStatus} onValueChange={(value) => setFormStatus(value as 'published' | 'draft')}>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="published" id="published" className="text-cyan-400" />
                        <label htmlFor="published" className="text-white cursor-pointer">Published</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="draft" id="draft" className="text-purple-400" />
                        <label htmlFor="draft" className="text-white cursor-pointer">Draft</label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Content</label>
                  <Textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={8}
                    placeholder="Write your post content here..."
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 rounded-lg"
                  />
                </div>
                <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
                  <Button
                    onClick={closeModal}
                    variant="outline"
                    className="bg-transparent border border-white/20 text-white hover:bg-white/10 rounded-lg px-6 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateOrUpdatePost}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-medium rounded-lg px-6 py-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    {isEditing ? 'Update Post' : 'Create Post'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BlogTable
