import { useState, useEffect } from 'react';
import { getConnections } from '../../services/api.js';

export default function ConnectionListView() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getConnections()
      .then((data) => setConnections(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="module-container">
      <h2>Quản lý Kết nối (Connections)</h2>
      <p className="module-desc">Phụ trách: Thành viên 5 · Nhánh: <code>feature/matching-connection</code></p>

      {loading ? (
        <p>Đang tải danh sách kết nối...</p>
      ) : connections.length === 0 ? (
        <div className="card">
          <p>Chưa có yêu cầu kết nối nào được tạo.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {connections.map((c) => (
            <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4>Mã kết nối: {c.id}</h4>
                <p style={{ fontSize: '13px', color: '#666' }}>
                  Yêu cầu: <b>{c.requestId}</b> · Đối tác: <b>{c.supplierId}</b>
                </p>
                <small style={{ color: '#888' }}>Tạo lúc: {new Date(c.createdAt).toLocaleString('vi-VN')}</small>
              </div>
              <span className="phase-pill" style={{ background: c.status === 'pending' ? '#fef3c7' : '#dcfce7', color: c.status === 'pending' ? '#92400e' : '#166534' }}>
                {c.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

