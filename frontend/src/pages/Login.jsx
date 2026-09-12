import React from 'react'
import { Mail, Lock, GraduationCap, ShieldCheck, ArrowLeft } from 'lucide-react'
import Logo from '../components/Logo.jsx'

export default function Login({go}){
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex">
    <div className="hidden lg:flex lg:w-1/2 bg-blue-700 text-white p-14 flex-col justify-between">
      <Logo />
      <div>
        <div className="text-sm font-extrabold tracking-[0.25em] text-blue-200">BIENVENIDO A LINGOVA</div>
        <h1 className="text-5xl font-black mt-5 leading-tight">Una experiencia simple para enseñar, aprender y gestionar.</h1>
        <p className="mt-5 text-blue-100 text-lg max-w-xl">Esta versión es únicamente visual. Las credenciales de prueba permiten identificar qué vista corresponde a cada rol, sin ejecutar acciones reales.</p>
      </div>
      <button onClick={()=>go('home')} className="self-start flex items-center gap-2 text-blue-100 font-semibold"><ArrowLeft size={18}/> Volver al inicio</button>
    </div>

    <div className="w-full lg:w-1/2 p-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl p-9 soft-shadow border border-slate-100">
        <div className="lg:hidden mb-8"><Logo /></div>
        <h2 className="text-3xl font-black">Iniciar sesión</h2>
        <p className="text-slate-500 mt-2">Acceso demostrativo a las vistas del sistema.</p>
        <div className="mt-8 space-y-4">
          <label className="block"><span className="text-sm font-bold text-slate-700">Correo electrónico</span><div className="relative mt-2"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input readOnly placeholder="usuario@lingova.pe" className="w-full border border-slate-200 rounded-xl py-3 pl-11 pr-4 bg-slate-50"/></div></label>
          <label className="block"><span className="text-sm font-bold text-slate-700">Contraseña</span><div className="relative mt-2"><Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input readOnly type="password" value="Demo123!" className="w-full border border-slate-200 rounded-xl py-3 pl-11 pr-4 bg-slate-50"/></div></label>
          <button className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-extrabold opacity-90 cursor-default">Ingresar</button>
        </div>

        <div className="mt-7 border-t border-slate-100 pt-6">
          <div className="font-extrabold text-sm text-slate-700 mb-3">Cuentas de prueba</div>
          <button onClick={()=>go('profesor')} className="w-full text-left border border-slate-200 rounded-xl p-4 mb-3 hover:bg-slate-50"><div className="flex gap-3"><div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><GraduationCap/></div><div><div className="font-extrabold">Profesor</div><div className="text-sm text-slate-500">profesor@lingova.pe</div><div className="text-xs text-slate-400">Contraseña: Demo123!</div></div></div></button>
          <button onClick={()=>go('admin')} className="w-full text-left border border-slate-200 rounded-xl p-4 hover:bg-slate-50"><div className="flex gap-3"><div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><ShieldCheck/></div><div><div className="font-extrabold">Administrador</div><div className="text-sm text-slate-500">admin@lingova.pe</div><div className="text-xs text-slate-400">Contraseña: Demo123!</div></div></div></button>
        </div>
      </div>
    </div>
  </div>
}
