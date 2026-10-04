import { API_URL } from "@/lib/api";
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, BookOpen, Clock3, FileText, LoaderCircle, Search, X } from 'lucide-react';
import { clearSearchHistory, readSearchHistory, rememberSearch, searchRequestParams } from '@/lib/library-search';


export default function SearchAutocomplete({ value, onChange, onSubmit, onSelectSubject, onSelectDocument, filters, popularSubjects = [], variant = 'library', label }) {
  const id = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [history, setHistory] = useState(readSearchHistory);
  const [response, setResponse] = useState({ key: '', documents: [], subjects: [], error: false });
  const query = value.trim();
  const requestKey = searchRequestParams({ ...filters, q: query }).toString();
  const matchingResponse = response.key === requestKey;
  const pending = focused && query.length >= 2 && !matchingResponse;
  const entries = query.length === 0
    ? [...history.map(text => ({ kind: 'history', title: text })), ...popularSubjects.slice(0, 3).map(name => ({ kind: 'subject', title: name }))]
    : matchingResponse ? [...response.subjects.map(subject => ({ kind: 'subject', title: subject.name, subtitle: `${subject.count} tài liệu phù hợp` })), ...response.documents.map(doc => ({ kind: 'document', title: doc.title, subtitle: `${doc.subjectName || 'Khác'} · ${(doc.availableFormats || [doc.fileType]).join(' / ')}`, id: doc._id }))] : [];
  const open = focused && !dismissed && (query.length === 0 || query.length >= 2);
  const selected = activeIndex >= 0 ? entries[activeIndex] : null;

  useEffect(() => {
    if (!focused || query.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/documents/suggestions?${requestKey}`, { signal: controller.signal });
        if (!res.ok) throw new Error('Không tải được gợi ý');
        const data = await res.json();
        if (!controller.signal.aborted) setResponse({ key: requestKey, documents: Array.isArray(data.documents) ? data.documents : [], subjects: Array.isArray(data.subjects) ? data.subjects : [], error: false });
      } catch {
        if (!controller.signal.aborted) setResponse({ key: requestKey, documents: [], subjects: [], error: true });
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [focused, requestKey, query.length]);

  useEffect(() => {
    const close = event => { if (!rootRef.current?.contains(event.target)) { setFocused(false); setActiveIndex(-1); } };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  useEffect(() => {
    if (open && activeIndex >= 0) document.getElementById(`${id}-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [id, open, activeIndex]);

  const commit = entry => {
    const text = entry?.title || value;
    if (entry?.kind === 'document') { setHistory(rememberSearch(text)); onSelectDocument?.(entry.id); }
    else if (entry?.kind === 'subject') { onSelectSubject?.(text); }
    else { onChange(text); setHistory(rememberSearch(text)); onSubmit?.(text); }
    setDismissed(true); setActiveIndex(-1);
  };

  const handleKey = event => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Escape') { event.preventDefault(); setDismissed(true); setActiveIndex(-1); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); setDismissed(false);
      setActiveIndex(index => entries.length ? (event.key === 'ArrowDown' ? (index + 1) % entries.length : (index <= 0 ? entries.length - 1 : index - 1)) : -1);
    }
    if (event.key === 'Enter') { event.preventDefault(); commit(open ? selected : null); }
  };

  return (
    <div className={`search-autocomplete search-autocomplete-${variant}`} ref={rootRef}>
      <form className={variant === 'hero' ? 'hero-search' : 'library-search'} role="search" onSubmit={event => { event.preventDefault(); commit(open ? selected : null); }}>
        {variant !== 'hero' && <Search size={18} aria-hidden="true" />}
        <input ref={inputRef} id={id} role="combobox" aria-label={label} aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-suggestions`} aria-activedescendant={open && selected ? `${id}-option-${activeIndex}` : undefined} autoComplete="off" placeholder={variant === 'hero' ? 'Tìm môn học, đề thi, giáo trình...' : 'Tìm tên tài liệu hoặc từ khóa...'} value={value} maxLength={200} onChange={event => { onChange(event.target.value); setDismissed(false); setActiveIndex(-1); }} onFocus={() => { setFocused(true); setDismissed(false); setHistory(readSearchHistory()); }} onBlur={event => { if (!rootRef.current?.contains(event.relatedTarget)) { setFocused(false); setActiveIndex(-1); } }} onKeyDown={handleKey} />
        {value && <button type="button" className="search-clear" aria-label="Xóa từ khóa" onClick={() => { onChange(''); setActiveIndex(-1); setDismissed(false); inputRef.current?.focus(); }}><X size={16} /></button>}
        {variant === 'hero' && <button type="submit" aria-label="Tìm ngay"><Search size={23} /></button>}
      </form>
      {open && (
        <div className="search-dropdown">
          <div className="search-dropdown-heading"><span>{query ? 'GỢI Ý PHÙ HỢP' : history.length ? 'GẦN ĐÂY & HỌC PHẦN' : 'BẮT ĐẦU TÌM KIẾM'}</span>{!query && history.length > 0 && <button type="button" onClick={() => { clearSearchHistory(); setHistory([]); inputRef.current?.focus(); }}>Xóa lịch sử</button>}</div>
          <ul id={`${id}-suggestions`} role="listbox" aria-label="Gợi ý tìm kiếm">
            {entries.map((entry, index) => {
              const Icon = entry.kind === 'subject' ? BookOpen : entry.kind === 'history' ? Clock3 : FileText;
              return <li key={`${entry.kind}-${entry.id || entry.title}`} id={`${id}-option-${index}`} role="option" aria-selected={index === activeIndex} onPointerDown={event => event.preventDefault()} onClick={() => commit(entry)}><Icon size={17} /><div><strong>{entry.title}</strong><span>{entry.subtitle || (entry.kind === 'history' ? 'Tìm kiếm gần đây' : 'Lọc theo học phần')}</span></div><ArrowUpRight size={15} /></li>;
            })}
          </ul>
          {pending ? <p className="search-dropdown-status" role="status"><LoaderCircle size={15} className="animate-spin" /> Đang tìm gợi ý…</p> : query && entries.length === 0 ? <p className="search-dropdown-status" role="status">{response.error ? 'Gợi ý đang tạm gián đoạn. Bạn vẫn có thể nhấn Enter để tìm.' : 'Chưa có gợi ý phù hợp. Nhấn Enter để tìm trên toàn thư viện.'}</p> : null}
          <p className="search-keyboard-hint">↑ ↓ để chọn · Enter để tìm · Esc để đóng</p>
        </div>
      )}
    </div>
  );
}
