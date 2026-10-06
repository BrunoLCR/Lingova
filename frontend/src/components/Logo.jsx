import React from 'react'
import { Layers3 } from 'lucide-react'

export default function Logo({compact=false}){
  return <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md"><Layers3 size={21}/></div>
    {!compact && <div className="leading-tight"><div className="font-extrabold text-blue-700 tracking-tight">LINGOVA</div><div className="text-[11px] font-semibold text-slate-500">English Language Live Online School</div></div>}
  </div>
}
