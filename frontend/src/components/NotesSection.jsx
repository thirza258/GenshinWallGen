

const NotesSection = ({ notes, onNotesChange }) => {
  return (
    <div>
      <div className="font-mono text-xs tracking-wider uppercase text-[#151D4D] mb-3">
        Notes / Reminders
      </div>
      <div className="bg-[#FFFCF3] border border-black/15 rounded-xl p-5">
        <textarea
          value={notes}
          onChange={onNotesChange}
          placeholder="Add a reminder or note…"
          rows={3}
          className="w-full px-3 py-3 bg-[#FDE7CE]/30 border border-black/15 rounded-lg text-black text-sm resize-y outline-none focus:border-[#151D4D] placeholder:text-black/40"
        />
      </div>
    </div>
  );
};

export default NotesSection;
