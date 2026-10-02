import { X } from 'lucide-react';

export default function SubjectFilter({ subjects = [], selectedSubject = '', onSelectSubject }) {
  return (
    <div className="subject-filter" role="group" aria-label="Lọc theo học phần">
      {subjects.map((subject) => {
        const active = (subject === 'Tất cả' && !selectedSubject) || selectedSubject === subject;
        return <button key={subject} type="button" aria-pressed={active} className={active ? 'is-active' : ''} onClick={() => onSelectSubject(subject === 'Tất cả' || selectedSubject === subject ? '' : subject)}>{subject}</button>;
      })}
      {selectedSubject && <button type="button" className="clear-filter" onClick={() => onSelectSubject('')}><X size={13} /> Xóa lọc</button>}
    </div>
  );
}
