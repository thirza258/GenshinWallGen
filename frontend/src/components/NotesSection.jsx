

const NotesSection = ({ notes, onNotesChange }) => {
  return (
    <div>
      <div className="font-mono text-xs tracking-wider uppercase text-indigo-400 mb-3">
        Notes / Reminders
      </div>
      <div className="bg-[#14142a] border border-indigo-500/15 rounded-xl p-5">
        <textarea
          value={notes}
          onChange={onNotesChange}
          placeholder="Add a reminder or note…"
          rows={3}
          className="w-full px-3 py-3 bg-white/5 border border-indigo-500/15 rounded-lg text-gray-200 text-sm resize-y outline-none focus:border-indigo-500 placeholder:text-indigo-300/40"
        />
      </div>
    </div>
  );
};

export default NotesSection;