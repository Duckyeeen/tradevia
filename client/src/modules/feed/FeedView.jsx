import { useState, useEffect } from 'react';
import { getSuppliers } from '../../services/api.js';
import { INDUSTRY_TAGS } from '../account/demoAccounts.js';
import { useCurrentAccount } from '../account/accountStore.js';
import { filterSuppliersByAccountTags } from './feedFilters.js';

const ACCOUNT_TAG_FILTER = 'account-tags';

export default function FeedView({ onSelectSupplier }) {
  const currentAccount = useCurrentAccount();
  const accountTags = currentAccount?.industryTags ?? [];
  const accountTagsKey = accountTags.join('|');
  const [suppliers, setSuppliers] = useState([]);
  const [selectedTag, setSelectedTag] = useState(() => accountTags.length ? ACCOUNT_TAG_FILTER : '');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedTag(accountTags.length ? ACCOUNT_TAG_FILTER : '');
  }, [currentAccount?.id, accountTagsKey]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const tag = selectedTag === ACCOUNT_TAG_FILTER ? '' : selectedTag;
    getSuppliers({ tag, search: searchTerm })
      .then((data) => {
        if (!active) return;
        setSuppliers(selectedTag === ACCOUNT_TAG_FILTER
          ? filterSuppliersByAccountTags(data, accountTags)
          : data);
      })
      .catch((err) => {
        if (!active) return;
        setSuppliers([]);
        setError(err.userMessage || err.message || 'Không tải được danh sách đối tác.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedTag, searchTerm, accountTagsKey]);

  const tags = INDUSTRY_TAGS;

  return (
    <div className="module-container">
      <h2>Bảng tin &amp; Khám phá đối tác</h2>
      <p className="module-desc">Phụ trách: Thành viên 3 · Nhánh: <code>feature/feed</code></p>
      {currentAccount && (
        <p className="module-desc">
          Gợi ý cho {currentAccount.displayName}: {accountTags.length ? accountTags.map((tag) => `#${tag}`).join(', ') : 'chưa chọn tag'}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', margin: '16px 0' }}>
        <input
          type="text"
          placeholder="Tìm theo tên công ty hoặc dịch vụ..."
          className="input-field"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          className={`btn ${selectedTag === '' ? 'btn-primary' : 'btn-outline'}`}
          aria-pressed={selectedTag === ''}
          onClick={() => setSelectedTag('')}
        >Tất cả</button>
        <button
          className={`btn ${selectedTag === ACCOUNT_TAG_FILTER ? 'btn-primary' : 'btn-outline'}`}
          aria-pressed={selectedTag === ACCOUNT_TAG_FILTER}
          onClick={() => setSelectedTag(ACCOUNT_TAG_FILTER)}
          disabled={accountTags.length === 0}
        >Tags của tôi</button>
        {tags.map((t) => (
          <button
            key={t}
            className={`btn ${selectedTag === t ? 'btn-primary' : 'btn-outline'}`}
            aria-pressed={selectedTag === t}
            onClick={() => setSelectedTag(t)}
          >
            #{t}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : error ? (
        <div className="card" role="alert">{error}</div>
      ) : suppliers.length === 0 ? (
        <div className="card" role="status">Không tìm thấy đối tác phù hợp. Hãy đổi tag hoặc từ khóa tìm kiếm.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {suppliers.map((s) => (
            <div key={s.id} className="card">
              <h4>{s.companyName}</h4>
              <p style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}>📍 {s.location || 'Chưa cập nhật'}</p>
              <p style={{ fontSize: '14px', margin: '8px 0' }}>{s.description}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '8px 0' }}>
                {(s.industryTags || []).map((tag) => (
                  <span key={tag} className="tag-pill">#{tag}</span>
                ))}
              </div>
              {onSelectSupplier && (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '8px' }}
                  onClick={() => onSelectSupplier(s.id)}
                >
                  Xem chi tiết
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

