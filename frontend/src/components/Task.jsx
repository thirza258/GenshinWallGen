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
      <div className="font-mono text-xs tracking-wider uppercase text-[#151D4D] mb-3">
        {title}
      </div>
      <div className="bg-[#FFFCF3] border border-black/15 rounded-xl p-5">
        <div className="flex flex-col gap-1.5">
          {tasks.map((task, idx) => (
            <div
              key={task.id || idx}
              className="flex items-center gap-2.5 px-3 py-2 bg-[#FDE7CE]/30 rounded-lg border border-transparent hover:border-black/15 hover:bg-[#FDE7CE]/50 transition-all group"
            >
              {/* Checkbox */}
              <button
                className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                  task.done
                    ? 'bg-[#151D4D] border-[#151D4D]'
                    : 'border-[#151D4D]/50 bg-transparent hover:border-[#151D4D]'
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
                className={`flex-1 bg-transparent text-[0.88rem] text-black outline-none font-body ${
                  task.done ? 'line-through text-black/40' : ''
                }`}
              />

              {/* Delete button */}
              <button
                onClick={() => onDelete(idx)}
                className="w-5.5 h-5.5 rounded-md text-[#151D4D]/50 hover:text-black hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
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
            className="flex-1 px-3 py-2 bg-[#FFFCF3] border border-black/15 rounded-lg text-black text-sm outline-none focus:border-[#151D4D] placeholder:text-black/40"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-[#FFFCF3] border border-black/15 rounded-lg text-[#151D4D] text-sm hover:bg-[#151D4D]/10 transition-all"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskSection;
