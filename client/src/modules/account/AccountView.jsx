import { INDUSTRY_TAGS } from './demoAccounts.js';
import { selectDemoAccount, updateCurrentAccount, useCurrentAccount } from './accountStore.js';

export default function AccountView() {
  const currentAccount = useCurrentAccount();

  const toggleTag = (tag) => {
    const industryTags = currentAccount.industryTags.includes(tag)
      ? currentAccount.industryTags.filter((item) => item !== tag)
      : [...currentAccount.industryTags, tag];
    updateCurrentAccount({ industryTags });
  };

  return (
    <div className="module-container">
      <h2>Tài khoản &amp; Lĩnh vực hoạt động</h2>
      <p className="module-desc">Chọn tài khoản demo và cập nhật hồ sơ. Dữ liệu được giữ trong phiên hiện tại.</p>

      <section className="card" aria-labelledby="demo-account-title">
        <h3 id="demo-account-title">1. Chọn tài khoản Demo</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', margin: '12px 0' }}>
          <button
            type="button"
            className={`btn ${currentAccount.accountType === 'personal' ? 'btn-primary' : 'btn-outline'}`}
            aria-pressed={currentAccount.accountType === 'personal'}
            onClick={() => selectDemoAccount('buyer-002')}
          >
            Personal · Linh Tran
          </button>
          <button
            type="button"
            className={`btn ${currentAccount.accountType === 'business' ? 'btn-primary' : 'btn-outline'}`}
            aria-pressed={currentAccount.accountType === 'business'}
            onClick={() => selectDemoAccount('buyer-001')}
          >
            Business · Minh Nguyen
          </button>
        </div>
        <p><strong>Loại tài khoản:</strong> {currentAccount.accountType === 'business' ? 'Doanh nghiệp' : 'Cá nhân'}</p>
        <p><strong>Mã buyer:</strong> <code>{currentAccount.id}</code></p>
        <p><strong>Tên hiển thị:</strong> {currentAccount.displayName}</p>
      </section>

      <section className="card" style={{ marginTop: '16px' }} aria-labelledby="account-profile-title">
        <h3 id="account-profile-title">2. Hồ sơ &amp; Industry Tags</h3>
        {currentAccount.accountType === 'business' && (
          <div style={{ margin: '12px 0' }}>
            <label htmlFor="account-company-name" style={{ display: 'block', marginBottom: '6px' }}>Tên doanh nghiệp:</label>
            <input
              id="account-company-name"
              type="text"
              className="input-field"
              value={currentAccount.companyName}
              onChange={(event) => updateCurrentAccount({ companyName: event.target.value })}
            />
          </div>
        )}

        <div style={{ margin: '12px 0' }}>
          <p style={{ marginBottom: '8px' }}>
            {currentAccount.accountType === 'business' ? 'Lĩnh vực doanh nghiệp' : 'Lĩnh vực quan tâm'}:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {INDUSTRY_TAGS.map((tag) => {
              const selected = currentAccount.industryTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`tag-pill ${selected ? 'tag-active' : ''}`}
                  aria-pressed={selected}
                  onClick={() => toggleTag(tag)}
                >
                  #{tag} {selected ? '✓' : '+'}
                </button>
              );
            })}
          </div>
          {currentAccount.industryTags.length === 0 ? (
            <p role="status" style={{ marginTop: '10px' }}>Chưa chọn lĩnh vực.</p>
          ) : (
            <p style={{ marginTop: '10px' }}>
              Tags đang chọn: {currentAccount.industryTags.map((tag) => `#${tag}`).join(', ')}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

