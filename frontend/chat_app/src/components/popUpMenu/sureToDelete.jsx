export default function DeleteConfirmDialog({ isOpen, onCancel, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[10000]"
      onClick={onCancel}
    >
      <div
        className="bg-slate-900 rounded-lg shadow-2xl p-6 max-w-sm mx-4 border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-100 mb-2">Delete message?</h2>
        <p className="text-slate-400 text-sm mb-6">
          This action cannot be undone.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors duration-150 font-medium text-sm"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-150 font-medium text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}