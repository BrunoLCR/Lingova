import React, { useState } from 'react'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Profesor from './pages/Profesor.jsx'
import Administrador from './pages/Administrador.jsx'

export default function App(){
  const [view, setView] = useState('home')
  const go = (name) => setView(name)
  if(view === 'login') return <Login go={go} />
  if(view === 'profesor') return <Profesor go={go} />
  if(view === 'admin') return <Administrador go={go} />
  return <Home go={go} />
}
