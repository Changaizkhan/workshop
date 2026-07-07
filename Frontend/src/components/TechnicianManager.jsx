import { useState } from 'react';

/** Admin/Manager: add or remove technician names */
export default function TechnicianManager({ technicians = [], onAdd, onDelete, canManage }) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  if (!canManage) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setError('Enter a technician name.');
      return;
    }
    setError('');
    try {
      await onAdd(trimmed);
      setNewName('');
    } catch (err) {
      setError(err.message || 'Could not add technician.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
      <div>
        <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 tracking-wider">
          Workshop Technicians
        </h3>
        <p className="text-[10px] text-slate-400 mt-0.5">Names shown when assigning jobs</p>
      </div>
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add new technician name..."
          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer shrink-0"
        >
          ➕ Add
        </button>
      </form>
      {error && <p className="text-[10px] text-rose-500 font-bold">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {technicians.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-lg"
          >
            {name}
            <button
              type="button"
              onClick={() => onDelete(name)}
              className="text-rose-500 hover:text-rose-400 cursor-pointer"
              title={`Remove ${name}`}
            >
              ✕
            </button>
          </span>
        ))}
        {technicians.length === 0 && (
          <span className="text-[10px] text-slate-400 italic">No technicians yet — add names above.</span>
        )}
      </div>
    </div>
  );
}
