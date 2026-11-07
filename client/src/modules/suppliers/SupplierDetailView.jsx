import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import './SupplierDetailView.css';

const FALLBACK = 'Chưa cung cấp';
const CAPACITY_LABELS = { small: 'Nhỏ', medium: 'Vừa', large: 'Lớn' };

const displayValue = (value) => (
  typeof value === 'string' && value.trim() ? value.trim() : FALLBACK
);

const capacityLabel = (value) => {
  if (typeof value !== 'string') return FALLBACK;
  return CAPACITY_LABELS[value.trim().toLowerCase()] || displayValue(value);
};

const asList = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

function DetailSection({ title, children, empty = false, emptyLabel = FALLBACK }) {
  return (
    <section className="supplier-section">
      <h3>{title}</h3>
      {empty ? <p className="supplier-empty">{emptyLabel}</p> : children}
    </section>
  );
}

function SupplierState({ title, message, children, onBack }) {
  return (
    <section className="module-container" aria-live="polite">
      <h2>{title}</h2>
      {message && <p className="supplier-state-message" role="alert">{message}</p>}
      <div className="supplier-actions">
        {children}
        {onBack && <button className="btn btn-outline" type="button" onClick={onBack}>← Quay lại</button>}
      </div>
    </section>
  );
}

export default function SupplierDetailView({ supplierId = 'supplier-001', onCreateRequest, onBack }) {
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setSupplier(null);

    api.getSupplierById(supplierId, { signal: controller.signal })
      .then((data) => { if (active) setSupplier(data || null); })
      .catch((err) => {
        if (active) setError(err.userMessage || 'Không thể tải hồ sơ nhà cung cấp. Vui lòng thử lại.');
      })
      .finally(() => { if (active) setLoading(false); });

    return () => {
      active = false;
      controller.abort();
    };
  }, [supplierId, reloadKey]);

  if (loading) {
    return (
      <section className="module-container" role="status" aria-live="polite">
        <h2>Hồ sơ năng lực nhà cung cấp</h2>
        <p className="supplier-state-message">⏳ Đang tải thông tin đối tác…</p>
      </section>
    );
  }

  if (error) {
    return (
      <SupplierState title="Không tải được hồ sơ nhà cung cấp" message={error} onBack={onBack}>
        <button className="btn btn-outline" type="button" onClick={() => setReloadKey((key) => key + 1)}>
          🔄 Thử tải lại
        </button>
      </SupplierState>
    );
  }

  if (!supplier) {
    return (
      <SupplierState
        title="Không tìm thấy nhà cung cấp"
        message={`Không có dữ liệu cho mã ${supplierId}.`}
        onBack={onBack}
      />
    );
  }

  const tags = asList(supplier.industryTags);
  const services = asList(supplier.services);
  const certifications = asList(supplier.certifications);

  return (
    <section className="module-container">
      <div className="supplier-heading">
        <div>
          <h2>Hồ sơ năng lực nhà cung cấp</h2>
          <p className="module-desc">Thông tin đối tác và năng lực cung ứng</p>
        </div>
        {onBack && <button className="btn btn-outline" type="button" onClick={onBack}>← Quay lại Feed</button>}
      </div>

      <article className="card">
        <header className="supplier-profile-heading">
          <div>
            <h3>{displayValue(supplier.companyName)}</h3>
            <span className="supplier-id">Mã NCC: {displayValue(supplier.id)}</span>
          </div>
        </header>

        <dl className="supplier-facts">
          <div><dt>📍 Địa điểm</dt><dd>{displayValue(supplier.location)}</dd></div>
          <div><dt>🏢 Mô hình</dt><dd>{displayValue(supplier.businessModel)}</dd></div>
          <div><dt>📏 Quy mô</dt><dd>{capacityLabel(supplier.capacity)}</dd></div>
        </dl>

        <DetailSection title="📝 Mô tả">
          <p className="supplier-description">{displayValue(supplier.description)}</p>
        </DetailSection>

        <DetailSection title="🏷️ Lĩnh vực" empty={!tags.length}>
          <div className="supplier-list supplier-tags">
            {tags.map((tag, index) => <span key={`${tag}-${index}`} className="tag-pill">#{tag}</span>)}
          </div>
        </DetailSection>

        <DetailSection title="⚙️ Dịch vụ cung ứng" empty={!services.length}>
          <ul className="supplier-services">
            {services.map((service, index) => <li key={`${service}-${index}`}>{service}</li>)}
          </ul>
        </DetailSection>

        <DetailSection title="🏅 Chứng chỉ chất lượng" empty={!certifications.length} emptyLabel="Chưa có chứng chỉ">
          <div className="supplier-list">
            {certifications.map((cert, index) => (
              <span key={`${cert}-${index}`} className="tag-pill certification-pill">✓ {cert}</span>
            ))}
          </div>
        </DetailSection>

        {onCreateRequest && (
          <footer className="supplier-actions supplier-cta">
            <button className="btn btn-primary" type="button" onClick={() => onCreateRequest(supplier)}>
              📝 Tạo yêu cầu với nhà cung cấp này
            </button>
          </footer>
        )}
      </article>
    </section>
  );
}
