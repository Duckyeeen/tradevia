import { useState, useEffect } from 'react';
import { getApiStatus, subscribeApiStatus, retryLiveApi } from './services/api.js';

import AccountView from './modules/account/AccountView.jsx';
import FeedView from './modules/feed/FeedView.jsx';
import SupplierDetailView from './modules/suppliers/SupplierDetailView.jsx';
import CreateRequestView from './modules/requests/CreateRequestView.jsx';
import MatchingView from './modules/matching/MatchingView.jsx';
import ConnectionListView from './modules/connections/ConnectionListView.jsx';

const workstreams = [
  { number: '01', title: 'Tài khoản & lĩnh vực', owner: 'Thành viên 2', tab: 'account' },
  { number: '02', title: 'Feed & khám phá', owner: 'Thành viên 3', tab: 'feed' },
  { number: '03', title: 'Hồ sơ nhà cung cấp', owner: 'Thành viên 4', tab: 'supplier' },
  { number: '04', title: 'Tạo yêu cầu (Buyer Request)', owner: 'Thành viên 4', tab: 'request' },
  { number: '05', title: 'Matching & điểm số', owner: 'Thành viên 5', tab: 'matching' },
  { number: '06', title: 'Kết nối (Connections)', owner: 'Thành viên 5', tab: 'connections' },
];

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [apiStatus, setApiStatus] = useState(getApiStatus());
  const [selectedSupplierId, setSelectedSupplierId] = useState('supplier-001');
  const [createdRequestId, setCreatedRequestId] = useState('request-001');

  useEffect(() => {
    return subscribeApiStatus((status) => setApiStatus({ ...status }));
  }, []);

  const handleSelectSupplier = (id) => {
    setSelectedSupplierId(id);
    setActiveTab('supplier');
  };

  const handleRequestCreated = (req) => {
    setCreatedRequestId(req.id);
    setActiveTab('matching');
  };

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#home" onClick={() => setActiveTab('home')}>
          <span className="brand-mark" aria-hidden="true">T</span>
          <span>TRADEVIA</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="environment">
            <span className="status-dot" style={{ background: apiStatus.source === 'live' ? '#10b981' : '#f59e0b' }} />
            {apiStatus.source === 'live' ? 'Backend Live (Port 3000)' : 'Chế độ Mock (Offline)'}
          </span>
        </div>
      </header>

      {/* Banner cảnh báo Mock Mode */}
      {apiStatus.source === 'mock' && (
        <div className="api-banner banner-mock">
          <span>⚠️ <strong>Đang dùng dữ liệu Mock</strong> (Backend chưa bật hoặc mất kết nối). Mọi tính năng vẫn chạy bình thường.</span>
          <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={retryLiveApi}>
            Thử kết nối lại Backend
          </button>
        </div>
      )}

      {/* Thanh điều hướng Tabs */}
      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'home' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          🏠 Trang chủ
        </button>
        <button
          className={`tab-btn ${activeTab === 'account' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          👤 1. Tài khoản (TV2)
        </button>
        <button
          className={`tab-btn ${activeTab === 'feed' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          📰 2. Bảng tin Feed (TV3)
        </button>
        <button
          className={`tab-btn ${activeTab === 'supplier' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('supplier')}
        >
          🏭 3. Hồ sơ NCC (TV4)
        </button>
        <button
          className={`tab-btn ${activeTab === 'request' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('request')}
        >
          📝 4. Tạo yêu cầu (TV4)
        </button>
        <button
          className={`tab-btn ${activeTab === 'matching' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('matching')}
        >
          ⚡ 5. Matching &amp; Điểm (TV5)
        </button>
        <button
          className={`tab-btn ${activeTab === 'connections' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          🤝 6. Kết nối (TV5)
        </button>
      </nav>

      {/* Nội dung theo Tab */}
      {activeTab === 'home' && (
        <>
          <section className="hero" id="home">
            <div className="hero-copy">
              <p className="eyebrow">B2B SOURCING &amp; SERVICE MARKETPLACE</p>
              <h1>Tìm đúng đối tác.<br /><span>Xây chuỗi cung ứng tốt hơn.</span></h1>
              <p className="intro">
                TRADEVIA giúp doanh nghiệp khám phá nhà cung cấp và dịch vụ phù hợp
                theo lĩnh vực, năng lực và nhu cầu kinh doanh.
              </p>
              <div className="hero-note">
                <span className="note-icon" aria-hidden="true">↗</span>
                <span>Toàn bộ 8 Backend APIs &amp; Matching Engine đã sẵn sàng!</span>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="orbit orbit-three" />
              <div className="hub"><span>T</span><small>TRADEVIA</small></div>
              <div className="node node-top">Sourcing</div>
              <div className="node node-right">Supplier</div>
              <div className="node node-bottom">Business</div>
              <div className="node node-left">Services</div>
              <span className="spark spark-one">✳</span>
              <span className="spark spark-two">✳</span>
            </div>
          </section>

          <section className="workspace" aria-labelledby="workspace-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">PROJECT WORKSPACE</p>
                <h2 id="workspace-title">Các phân hệ của nhóm</h2>
              </div>
              <span className="phase-pill"><span className="status-dot" /> Đã phân chia module</span>
            </div>

            <div className="workstream-grid">
              {workstreams.map((item) => (
                <article
                  className="workstream-card"
                  key={item.number}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveTab(item.tab)}
                >
                  <span className="card-number">{item.number}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.owner}</p>
                  </div>
                  <span className="card-status" style={{ color: 'var(--green-dark)', background: '#e3f0e8' }}>
                    Mở module →
                  </span>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {activeTab === 'account' && <AccountView />}
      {activeTab === 'feed' && <FeedView onSelectSupplier={handleSelectSupplier} />}
      {activeTab === 'supplier' && <SupplierDetailView supplierId={selectedSupplierId} />}
      {activeTab === 'request' && <CreateRequestView onRequestCreated={handleRequestCreated} />}
      {activeTab === 'matching' && <MatchingView initialRequestId={createdRequestId} />}
      {activeTab === 'connections' && <ConnectionListView />}

      <footer className="footer">
        <span>TRADEVIA <span className="footer-separator">/</span> Đồ án Kỹ thuật Thương mại Điện tử</span>
        <span>Local development · MVP Full Stack Ready</span>
      </footer>
    </main>
  );
}

export default App;
