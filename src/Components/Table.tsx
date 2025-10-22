import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'


import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

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


} from '../store/postsSlice'
import type { Post } from '../lib/api'
import {
  FileText,
  LogOut,
  Plus,
  Eye,
  Edit,
  Trash2,
  User,
  Calendar,
  Heart,
  MessageCircle,
  X,
  BookOpen
} from 'lucide-react'

// Available categories removed for cleaner design

function BlogTable() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { posts, loading, currentPost: reduxCurrentPost } = useSelector((state: RootState) => state.posts)

  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewingPost, setViewingPost] = useState<Post | null>(null)

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)



  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')



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
    setShowModal(true)
  }

  const openEditModal = (post: Post) => {
    setIsEditing(true)
    dispatch(setCurrentPost(post))
    setFormTitle(post.title)
    setFormContent(post.content || '')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setViewingPost(null)
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
          content: formContent,
          likes: 0,
          comments: 0
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
    setViewingPost(post)
    setIsEditing(false)
    setShowModal(true)
  }



  // Filter posts based on search term
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  return (
    <div className="min-h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col relative">
      {/* Animated Background Particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-40"></div>
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-indigo-400 rounded-full animate-pulse opacity-50"></div>
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-violet-400 rounded-full animate-ping opacity-30"></div>
        <div className="absolute bottom-1/3 right-1/2 w-2.5 h-2.5 bg-purple-300 rounded-full animate-pulse opacity-40"></div>
        <div className="absolute top-3/4 left-1/2 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-50"></div>
      </div>

      {/* Header */}
      <header className="relative bg-gradient-to-r from-blue-700 via-purple-600 to-pink-600 shadow-lg py-6 px-6 border-b border-white/20">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center bg-sky-500/30 shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-fancy-serif">
                Blog Dashboard
              </h1>
              <p className="text-sm text-white/80">Manage your creative content</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">MD</span>
              </div>
              <div>
                <p className="text-white font-medium">Mahesh Dubey</p>
                <p className="text-gray-800 text-sm">Content Creator</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 font-medium rounded-lg px-6 py-2 transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center"
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-grow container mx-auto px-6 py-8 overflow-hidden relative z-10">
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
          {/* Action Bar */}
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm p-6 border-b border-white/20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-grow">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-12 h-12  bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center bg-sky-500/30 shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Blog Posts</h2>
                    <p className="text-white/80 text-sm">Create and manage your content</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center text-white/80">
                    <div className="w-2 h-2 bg-pink-400 rounded-full mr-2 animate-pulse"></div>
                    {filteredPosts.length} posts
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="relative group">
                  {/* <Input
                    type="text"
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-pink-400 focus:border-pink-400 w-full lg:w-64 transition-all duration-300"
                  /> */}
                  {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/60 absolute left-3 top-2.5 group-focus-within:text-pink-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg> */}
                </div>
                <Button
                  onClick={openCreateModal}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-medium rounded-lg px-6 py-2 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center whitespace-nowrap"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Post
                </Button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
                </div>
                <p className="text-white text-lg font-medium">Loading your posts...</p>
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-white/10 to-white/5 border-b border-white/30">
                      <TableHead className="py-4 px-6 text-left text-sm font-semibold text-white">ID</TableHead>
                      <TableHead className="py-4 px-6 text-left text-sm font-semibold text-white">Title</TableHead>
                      <TableHead className="py-4 px-6 text-left text-sm font-semibold text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.map((post) => (
                      <TableRow key={post.id} className="border-b border-white/20 hover:bg-gradient-to-r hover:from-white/5 hover:to-white/10 transition-all duration-300">
                        <TableCell className="py-4 px-6 text-white font-mono">{post.id}</TableCell>
                        <TableCell className="py-4 px-6 text-white font-medium">
                          <div className="truncate max-w-[250px]">{post.title}</div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex space-x-4">
                            <Button
                              onClick={() => handleViewPost(post)}
                              variant="ghost"
                              size="icon"
                              className="text-cyan-400 hover:text-cyan-300 hover:bg-white/10"
                              title="View"
                            >
                              <Eye className="h-5 w-5" />
                            </Button>
                            <Button
                              onClick={() => openEditModal(post)}
                              variant="ghost"
                              size="icon"
                              className="text-purple-400 hover:text-purple-300 hover:bg-white/10"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5" />
                            </Button>
                            <Button
                              onClick={() => handleDeletePost(post.id)}
                              variant="ghost"
                              size="icon"
                              className="text-red-400 hover:text-red-300 hover:bg-white/10"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
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
                  <FileText className="h-20 w-20 mx-auto text-white/60" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No blog posts found</h3>
                <p className="text-white/80 mb-6">Start creating amazing content for your audience</p>
                <Button
                  onClick={openCreateModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-8 py-3 transition-all duration-300 shadow-sm hover:shadow-md flex items-center mx-auto"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Post
                </Button>
              </div>
            )}
          </div>
        </Card>
      </main>

      {/* Notification */}
      {notification && (
        <Alert className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-lg border max-w-sm ${
          notification.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className={`w-3 h-3 rounded-full ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } mr-3`}></div>
          <AlertDescription className="flex items-center">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Modal for Create/Edit/View */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-white/20 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-xl" aria-describedby="dialog-description">
          <div id="dialog-description" className="sr-only">
            {isEditing ? 'Edit existing blog post' : viewingPost ? 'View blog post details' : 'Create a new blog post'}
          </div>
          <DialogHeader className="bg-gradient-to-r from-white/10 to-white/5 p-6 border-b border-white/20 rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                {isEditing ? (
                  <Edit className="h-5 w-5 text-white" />
                ) : viewingPost ? (
                  <Eye className="h-5 w-5 text-white" />
                ) : (
                  <Plus className="h-5 w-5 text-white" />
                )}
              </div>
              <DialogTitle className="text-2xl font-bold text-white">
                {isEditing ? 'Edit Post' : viewingPost ? 'View Post' : 'Create New Post'}
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="p-6">
            {viewingPost && !isEditing ? (
              // View mode - Simple layout
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-6 border border-white/20">
                  <h1 className="text-3xl font-bold text-white mb-4">{viewingPost.title}</h1>
                  <div className="text-white/80 leading-relaxed whitespace-pre-line text-lg">
                    {viewingPost.content || 'No content available.'}
                  </div>
                </div>
                <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
                  <Button
                    onClick={() => {
                      setViewingPost(null)
                      setIsEditing(true)
                      setFormTitle(viewingPost.title)
                      setFormContent(viewingPost.content || '')
                    }}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-medium rounded-lg px-6 py-2 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Edit className="h-5 w-5 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={closeModal}
                    variant="outline"
                    className="bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 rounded-lg px-6 py-2"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              // Create/Edit mode - Simple form
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Title</label>
                  <Input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Enter post title"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Content</label>
                  <Textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={8}
                    placeholder="Write your post content here..."
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 rounded-lg"
                  />
                </div>
                <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
                  <Button
                    onClick={closeModal}
                    variant="outline"
                    className="bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-lg px-6 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateOrUpdatePost}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-medium rounded-lg px-6 py-2 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {isEditing ? 'Update' : 'Create'}
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
