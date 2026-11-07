import { useState } from 'react';
import { runMatching, createConnection } from '../../services/api.js';

export default function MatchingView({ initialRequestId = 'request-001', buyerId = 'buyer-001' }) {
  const [requestId, setRequestId] = useState(initialRequestId);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRunMatch = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await runMatching(requestId);
      setResults(data.results || []);
    } catch (err) {
      setMessage(`Lỗi: ${err.userMessage || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (supplierId) => {
    try {
      await createConnection({
        requestId,
        buyerId,
        supplierId,
      });
      alert(`Đã gửi yêu cầu kết nối thành công tới ${supplierId}!`);
    } catch (err) {
      alert(`Lỗi kết nối: ${err.userMessage || err.message}`);
    }
  };

  return (
    <div className="module-container">
      <h2>Kết quả Phù hợp &amp; Matching Score</h2>
      <p className="module-desc">Phụ trách: Thành viên 5 · Nhánh: <code>feature/matching-connection</code></p>

      <div className="card" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <label>Mã Request:</label>
        <input
          className="input-field"
          value={requestId}
          onChange={(e) => setRequestId(e.target.value)}
          style={{ width: '180px' }}
        />
        <button className="btn btn-primary" onClick={handleRunMatch} disabled={loading}>
          {loading ? 'Đang phân tích...' : '⚡ Chạy Matching'}
        </button>
      </div>

      {message && <p style={{ color: 'red', marginTop: '12px' }}>{message}</p>}

      <div style={{ marginTop: '20px' }}>
        {results.map((r, index) => (
          <div key={r.supplierId} className="card" style={{ marginBottom: '16px', borderLeft: `6px solid ${r.score >= 70 ? '#10b981' : r.score >= 40 ? '#f59e0b' : '#ef4444'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="phase-pill">Top #{index + 1}</span>
                <h3 style={{ display: 'inline', marginLeft: '8px' }}>{r.supplierId}</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{r.score}</span>
                <span style={{ color: '#666' }}>/100</span>
              </div>
            </div>

            <div style={{ margin: '12px 0', fontSize: '13px', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
              <strong>Điểm chi tiết 6 tiêu chí:</strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '6px' }}>
                <span>Tags (25%): <b>{r.breakdown.industryTags}đ</b></span>
                <span>Dịch vụ (25%): <b>{r.breakdown.services}đ</b></span>
                <span>Quy mô (20%): <b>{r.breakdown.capacity}đ</b></span>
                <span>Địa điểm (10%): <b>{r.breakdown.location}đ</b></span>
                <span>Chứng chỉ (10%): <b>{r.breakdown.compliance}đ</b></span>
                <span>Mô hình (10%): <b>{r.breakdown.businessModel}đ</b></span>
              </div>
            </div>

            {r.missingData && r.missingData.length > 0 && (
              <p style={{ color: '#b45309', fontSize: '12px', margin: '6px 0' }}>
                ⚠️ Thiếu dữ liệu đánh giá: {r.missingData.join(', ')}
              </p>
            )}

            <button
              className="btn btn-outline"
              style={{ marginTop: '8px' }}
              onClick={() => handleConnect(r.supplierId)}
            >
              🤝 Gửi Connection Request
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

