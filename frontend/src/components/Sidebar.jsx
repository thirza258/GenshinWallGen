
import TaskSection from './Task';
import NotesSection from './NotesSection';
import SettingsSection from './SettingsSection';

const Sidebar = ({
  dailyTasks,
  weeklyTasks,
  onToggleDaily,
  onEditDaily,
  onDeleteDaily,
  onAddDaily,
  onToggleWeekly,
  onEditWeekly,
  onDeleteWeekly,
  onAddWeekly,
  notes,
  onNotesChange,
  resolution,
  onResolutionChange,
  onDownload,
  downloadEnabled,
}) => {
  return (
    <aside className="border-r border-indigo-500/15 bg-[#0e0e1e] p-7 overflow-y-auto flex flex-col gap-6">
      <TaskSection
        title="Daily Tasks"
        tasks={dailyTasks}
        onToggle={onToggleDaily}
        onEdit={onEditDaily}
        onDelete={onDeleteDaily}
        onAdd={onAddDaily}
        addInputId="daily-input"
      />
      <TaskSection
        title="Weekly Tasks"
        tasks={weeklyTasks}
        onToggle={onToggleWeekly}
        onEdit={onEditWeekly}
        onDelete={onDeleteWeekly}
        onAdd={onAddWeekly}
        addInputId="weekly-input"
      />
      <NotesSection notes={notes} onNotesChange={onNotesChange} />
      <SettingsSection resolution={resolution} onResolutionChange={onResolutionChange} />
      <button
        onClick={onDownload}
        disabled={!downloadEnabled}
        className="w-full flex justify-center items-center gap-2 py-3 rounded-xl bg-[#14142a] border border-indigo-500/20 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download Wallpaper
      </button>
    </aside>
  );
};

export default Sidebar;