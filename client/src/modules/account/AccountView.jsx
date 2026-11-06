import { useState } from 'react';

export default function AccountView() {
  const [accountType, setAccountType] = useState('Personal');
  const [companyName, setCompanyName] = useState('Demo Business Corp');
  const [selectedTags, setSelectedTags] = useState(['electronics', 'manufacturing']);

  const availableTags = ['electronics', 'manufacturing', 'logistics', 'textile', 'sustainability', 'automation'];

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="module-container">
      <h2>Tài khoản &amp; Lĩnh vực hoạt động</h2>
      <p className="module-desc">Phụ trách: Thành viên 2 · Nhánh: <code>feature/account</code></p>

      <div className="card">
        <h3>1. Chọn loại tài khoản Demo</h3>
        <div style={{ display: 'flex', gap: '12px', margin: '12px 0' }}>
          <button
            className={`btn ${accountType === 'Personal' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setAccountType('Personal')}
          >
            Personal (Cá nhân)
          </button>
          <button
            className={`btn ${accountType === 'Business' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setAccountType('Business')}
          >
            Business (Doanh nghiệp)
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <h3>2. Hồ sơ doanh nghiệp &amp; Industry Tags</h3>
        <div style={{ margin: '12px 0' }}>
          <label style={{ display: 'block', marginBottom: '6px' }}>Tên doanh nghiệp:</label>
          <input
            type="text"
            className="input-field"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <div style={{ margin: '12px 0' }}>
          <label style={{ display: 'block', marginBottom: '6px' }}>Lĩnh vực quan tâm (Industry Tags):</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-pill ${selectedTags.includes(tag) ? 'tag-active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                #{tag} {selectedTags.includes(tag) ? '✓' : '+'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

