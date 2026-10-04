import { useId, useState } from 'react';
import { ChevronDown, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { SEARCH_DEFAULTS } from '@/lib/library-search';

const ADVANCED_KEYS = ['subject', 'fileType', 'minRating', 'minDownloads', 'from', 'to', 'searchIn', 'match'];
const resetFilters = Object.fromEntries(ADVANCED_KEYS.map(key => [key, SEARCH_DEFAULTS[key]]));

export default function AdvancedSearch({ filters, subjects, onApply }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => Object.fromEntries(ADVANCED_KEYS.map(key => [key, filters[key]])));
  const [error, setError] = useState('');
  const count = ADVANCED_KEYS.filter(key => key !== 'match' && filters[key] !== SEARCH_DEFAULTS[key]).length;
  const change = (key, value) => { setDraft(prev => ({ ...prev, [key]: value })); setError(''); };
  const chips = [
    filters.subject && { label: filters.subject, keys: ['subject'] },
    filters.fileType && { label: filters.fileType, keys: ['fileType'] },
    filters.minRating && { label: `Từ ${filters.minRating} sao`, keys: ['minRating'] },
    filters.minDownloads && { label: `Từ ${filters.minDownloads} lượt tải`, keys: ['minDownloads'] },
    (filters.from || filters.to) && { label: `${filters.from ? new Date(`${filters.from}T00:00:00`).toLocaleDateString('vi-VN') : 'Bất kỳ ngày nào'} → ${filters.to ? new Date(`${filters.to}T00:00:00`).toLocaleDateString('vi-VN') : 'Không giới hạn'}`, keys: ['from', 'to'] },
    filters.searchIn !== 'all' && { label: filters.searchIn === 'title' ? 'Trong tiêu đề' : 'Trong từ khóa', keys: ['searchIn'] },
  ].filter(Boolean);
  const field = (key, name, content) => <label className="advanced-field" htmlFor={`${id}-${key}`}><span>{name}</span>{content}</label>;

  const apply = event => {
    event.preventDefault();
    if (draft.from && draft.to && draft.from > draft.to) { setError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'); return; }
    onApply({ ...draft, match: 'all' }); setOpen(false);
  };

  return (
    <div className="advanced-search">
      <div className="advanced-search-bar"><button type="button" className={`advanced-toggle ${open ? 'is-open' : ''}`} aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => setOpen(!open)}><SlidersHorizontal size={16} />Tìm kiếm nâng cao{count > 0 && <span>{count}</span>}<ChevronDown size={15} /></button>{count > 0 && <button type="button" className="advanced-reset" onClick={() => onApply(resetFilters)}><RotateCcw size={13} />Xóa bộ lọc nâng cao</button>}</div>
      {open && <form id={`${id}-panel`} className="advanced-panel" onSubmit={apply}>
        <div className="advanced-fields">
          {field('subject', 'Học phần', <select id={`${id}-subject`} value={draft.subject} onChange={event => change('subject', event.target.value)}><option value="">Tất cả học phần</option>{subjects.map(name => <option key={name} value={name}>{name}</option>)}</select>)}
          {field('fileType', 'Định dạng tệp', <select id={`${id}-fileType`} value={draft.fileType} onChange={event => change('fileType', event.target.value)}><option value="">Tất cả định dạng</option>{['PDF', 'DOCX', 'PPTX', 'XLSX', 'TXT'].map(type => <option key={type} value={type}>{type}</option>)}</select>)}
          {field('minRating', 'Đánh giá tối thiểu', <select id={`${id}-minRating`} value={draft.minRating} onChange={event => change('minRating', event.target.value)}><option value="">Không giới hạn</option>{[3, 4, 5].map(rating => <option key={rating} value={String(rating)}>{rating} sao trở lên</option>)}</select>)}
          {field('minDownloads', 'Lượt tải tối thiểu', <input id={`${id}-minDownloads`} type="number" min="0" max="1000000000" step="1" placeholder="Ví dụ: 10" value={draft.minDownloads} onChange={event => change('minDownloads', event.target.value)} />)}
          {field('from', 'Đăng từ ngày', <input id={`${id}-from`} type="date" value={draft.from} max={draft.to || undefined} onChange={event => change('from', event.target.value)} />)}
          {field('to', 'Đăng đến ngày', <input id={`${id}-to`} type="date" value={draft.to} min={draft.from || undefined} onChange={event => change('to', event.target.value)} />)}
          {field('searchIn', 'Tìm từ khóa trong', <select id={`${id}-searchIn`} value={draft.searchIn} onChange={event => change('searchIn', event.target.value)}><option value="all">Toàn bộ thông tin</option><option value="title">Tiêu đề tài liệu</option><option value="tags">Từ khóa tài liệu</option></select>)}
        </div>
        {error && <p className="advanced-error" role="alert">{error}</p>}
        <div className="advanced-panel-footer"><p>Chỉ tìm trong tài liệu đã được duyệt. Ngày đăng theo giờ Việt Nam.</p><div><button type="button" className="paper-button" onClick={() => { setDraft(resetFilters); setError(''); }}>Đặt lại</button><button type="submit" className="paper-button paper-button-primary">Áp dụng bộ lọc</button></div></div>
      </form>}
      {chips.length > 0 && <div className="active-search-filters" aria-label="Bộ lọc đang áp dụng">{chips.map(chip => <button type="button" key={chip.keys.join('-')} onClick={() => onApply(Object.fromEntries(chip.keys.map(key => [key, SEARCH_DEFAULTS[key]])))} aria-label={`Bỏ lọc ${chip.label}`}>{chip.label}<X size={12} /></button>)}</div>}
    </div>
  );
}
