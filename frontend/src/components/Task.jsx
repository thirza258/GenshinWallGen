import { useState } from 'react';

const TaskSection = ({ title, tasks, onToggle, onEdit, onDelete, onAdd, addInputId }) => {
  const [newTaskText, setNewTaskText] = useState('');

  const handleAdd = () => {
    if (newTaskText.trim()) {
      onAdd(newTaskText.trim());
      setNewTaskText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div>
      <div className="font-mono text-xs tracking-wider uppercase text-indigo-400 mb-3">
        {title}
      </div>
      <div className="bg-[#14142a] border border-indigo-500/15 rounded-xl p-5">
        <div className="flex flex-col gap-1.5">
          {tasks.map((task, idx) => (
            <div
              key={task.id || idx}
              className="flex items-center gap-2.5 px-3 py-2 bg-white/5 rounded-lg border border-transparent hover:border-indigo-500/20 hover:bg-white/5 transition-all group"
            >
              {/* Checkbox */}
              <button
                className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                  task.done
                    ? 'bg-emerald-400 border-emerald-400'
                    : 'border-indigo-300/50 bg-transparent hover:border-indigo-400'
                }`}
                onClick={() => onToggle(idx)}
              >
                {task.done && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
                    <polyline points="2 6 5 9 10 3" />
                  </svg>
                )}
              </button>

              {/* Editable task text */}
              <input
                type="text"
                value={task.text}
                onChange={(e) => onEdit(idx, e.target.value)}
                className={`flex-1 bg-transparent text-[0.88rem] text-gray-200 outline-none font-body ${
                  task.done ? 'line-through text-indigo-300/50' : ''
                }`}
              />

              {/* Delete button */}
              <button
                onClick={() => onDelete(idx)}
                className="w-5.5 h-5.5 rounded-md text-indigo-400/50 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Add task row */}
        <div className="flex gap-2 mt-3">
          <input
            id={addInputId}
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add task…"
            className="flex-1 px-3 py-2 bg-white/5 border border-indigo-500/15 rounded-lg text-gray-200 text-sm outline-none focus:border-indigo-500 placeholder:text-indigo-300/40"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-[#14142a] border border-indigo-500/15 rounded-lg text-indigo-300 text-sm hover:bg-indigo-500/10 transition-all"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskSection;