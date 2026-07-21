// import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  // const [count, setCount] = useState(0)

  return (
    <div className='App'>
      <Routes>
        {/* <Route path='/' element={<Navigate to={"/auth/login"} />} /> */}
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/me' element={<Home />} />
      </Routes>
    </div>
  )
}

export default App
