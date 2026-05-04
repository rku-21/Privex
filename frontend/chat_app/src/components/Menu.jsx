import { Edit2, Trash2, Copy } from "lucide-react";

export default function Menu({ x, y, onEdit, onCopy, onDelete }) {
  return (
    <div
      className="fixed bg-slate-900 border border-slate-700 rounded-lg shadow-2xl text-slate-100 z-[9999] py-1 min-w-max"
      style={{ top: `${y}px`, left: `${x}px` }}
    >
      <button
        onClick={onEdit}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-slate-800 transition-colors duration-150 first:rounded-t-md"
      >
        <Edit2 size={16} className="text-slate-400" /> Edit
      </button>

      <button
        onClick={onCopy}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-slate-800 transition-colors duration-150"
      >
        <Copy size={16} className="text-slate-400" /> Copy
      </button>

      <button
        onClick={onDelete}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-950 hover:text-red-300 transition-colors duration-150 last:rounded-b-md"
      >
        <Trash2 size={16} /> Delete
      </button>
    </div>
  );
}