import { useState, useEffect } from 'react';
import { getSuppliers } from '../../services/api.js';

export default function FeedView({ onSelectSupplier }) {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const tags = ['electronics', 'manufacturing', 'logistics', 'textile'];

  useEffect(() => {
    setLoading(true);
    getSuppliers({ tag: selectedTag, search: searchTerm })
      .then((data) => setSuppliers(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedTag, searchTerm]);

  return (
    <div className="module-container">
      <h2>Bảng tin &amp; Khám phá đối tác</h2>
      <p className="module-desc">Phụ trách: Thành viên 3 · Nhánh: <code>feature/feed</code></p>

      <div style={{ display: 'flex', gap: '12px', margin: '16px 0' }}>
        <input
          type="text"
          placeholder="Tìm theo tên công ty hoặc dịch vụ..."
          className="input-field"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="btn btn-outline" onClick={() => setSelectedTag('')}>Tất cả</button>
        {tags.map((t) => (
          <button
            key={t}
            className={`btn ${selectedTag === t ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSelectedTag(t)}
          >
            #{t}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
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

