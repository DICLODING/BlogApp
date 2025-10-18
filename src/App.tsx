import './App.css'
import { Routes, Route } from 'react-router-dom'
import Login from './Components/Login.tsx'
import BlogTable from './Components/Table.tsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/table" element={<BlogTable />} />
    </Routes>
  )
}

export default App