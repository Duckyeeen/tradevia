import { useState, useEffect } from 'react';
import { getSupplierById } from '../../services/api.js';

export default function SupplierDetailView({ supplierId = 'supplier-001' }) {
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSupplierById(supplierId)
      .then((data) => setSupplier(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [supplierId]);

  if (loading) return <p>Đang tải thông tin đối tác...</p>;
  if (!supplier) return <p>Không tìm thấy nhà cung cấp.</p>;

  return (
    <div className="module-container">
      <h2>Hồ sơ năng lực Nhà cung cấp</h2>
      <p className="module-desc">Phụ trách: Thành viên 4 · Nhánh: <code>feature/supplier-request</code></p>

      <div className="card">
        <h3>{supplier.companyName}</h3>
        <p><strong>Địa điểm:</strong> {supplier.location || 'Chưa cập nhật'}</p>
        <p><strong>Mô hình kinh doanh:</strong> {supplier.businessModel || 'B2B'}</p>
        <p><strong>Quy mô năng lực (Capacity):</strong> {supplier.capacity || 'Chưa cập nhật'}</p>
        <p><strong>Mô tả:</strong> {supplier.description}</p>

        <div style={{ margin: '12px 0' }}>
          <strong>Lĩnh vực:</strong>
          <div style={{ display: 'flex', gap: '6px', margin: '4px 0' }}>
            {(supplier.industryTags || []).map((t) => <span key={t} className="tag-pill">#{t}</span>)}
          </div>
        </div>

        <div style={{ margin: '12px 0' }}>
          <strong>Dịch vụ cung ứng:</strong>
          <ul>
            {(supplier.services || []).map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>

        <div style={{ margin: '12px 0' }}>
          <strong>Chứng chỉ chất lượng:</strong>
          <p>{(supplier.certifications && supplier.certifications.length) ? supplier.certifications.join(', ') : 'Chưa có chứng chỉ'}</p>
        </div>
      </div>
    </div>
  );
}

