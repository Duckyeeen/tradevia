import { useEffect, useState } from 'react';
import { createRequest } from '../../services/api.js';
import { useCurrentAccount } from '../account/accountStore.js';
import { buildBuyerRequestPayload } from './requestPayload.js';

export default function CreateRequestView({ onRequestCreated }) {
  const currentAccount = useCurrentAccount();
  const [formData, setFormData] = useState({
    title: 'Tìm đối tác gia công bản mạch IoT',
    description: 'Cần tìm nhà sản xuất linh kiện và lắp ráp SMT tại Việt Nam.',
    industryTags: (currentAccount?.industryTags ?? []).join(', '),
    requiredServices: 'contract manufacturing, sourcing',
    desiredCapacity: 'medium',
    location: 'Vietnam',
    complianceRequirements: 'ISO 9001',
    businessModel: 'B2B',
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    setFormData((previous) => ({
      ...previous,
      industryTags: (currentAccount?.industryTags ?? []).join(', '),
    }));
  }, [currentAccount?.id, currentAccount?.industryTags]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Đang gửi...');
    try {
      const payload = buildBuyerRequestPayload(formData, currentAccount);
      const res = await createRequest(payload);
      setStatus(`Tạo thành công! ID: ${res.id}`);
      if (onRequestCreated) onRequestCreated(res);
    } catch (err) {
      setStatus(`Lỗi: ${err.userMessage || err.message}`);
    }
  };

  return (
    <div className="module-container">
      <h2>Tạo Yêu cầu Tìm đối tác (Buyer Request)</h2>
      <p className="module-desc">Phụ trách: Thành viên 4 · Nhánh: <code>feature/supplier-request</code></p>
      {currentAccount && (
        <p className="module-desc">
          Tạo yêu cầu với {currentAccount.displayName} ({currentAccount.id}); industry tags được lấy từ tài khoản hiện tại.
        </p>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label>Tiêu đề yêu cầu:</label>
          <input
            className="input-field"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div>
          <label>Mô tả chi tiết:</label>
          <textarea
            className="input-field"
            rows="3"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label>Ngành nghề (cách nhau dấu phẩy):</label>
            <input
              className="input-field"
              value={formData.industryTags}
              onChange={(e) => setFormData({ ...formData, industryTags: e.target.value })}
            />
          </div>
          <div>
            <label>Dịch vụ cần tìm:</label>
            <input
              className="input-field"
              value={formData.requiredServices}
              onChange={(e) => setFormData({ ...formData, requiredServices: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label>Quy mô mong muốn:</label>
            <select
              className="input-field"
              value={formData.desiredCapacity}
              onChange={(e) => setFormData({ ...formData, desiredCapacity: e.target.value })}
            >
              <option value="small">Small (Nhỏ)</option>
              <option value="medium">Medium (Vừa)</option>
              <option value="large">Large (Lớn)</option>
            </select>
          </div>
          <div>
            <label>Địa điểm:</label>
            <input
              className="input-field"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div>
            <label>Chứng chỉ bắt buộc:</label>
            <input
              className="input-field"
              value={formData.complianceRequirements}
              onChange={(e) => setFormData({ ...formData, complianceRequirements: e.target.value })}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
          Đăng yêu cầu &amp; Bắt đầu Matching
        </button>

        {status && <p style={{ marginTop: '8px', fontWeight: 'bold' }}>{status}</p>}
      </form>
    </div>
  );
}

