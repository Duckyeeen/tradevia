import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import './CreateRequestView.css';

const DEFAULT_FORM = {
  title: 'Tìm đối tác gia công bản mạch IoT',
  description: 'Cần tìm nhà sản xuất linh kiện và lắp ráp SMT tại Việt Nam.',
  industryTags: 'electronics, manufacturing',
  requiredServices: 'contract manufacturing, sourcing',
  desiredCapacity: 'medium',
  location: 'Vietnam',
  complianceRequirements: 'ISO 9001',
  businessModel: 'B2B',
};

const FORM_FIELDS = {
  title: 'Tiêu đề yêu cầu',
  industryTags: 'Lĩnh vực',
  requiredServices: 'Dịch vụ cần tìm',
  desiredCapacity: 'Quy mô năng lực',
  businessModel: 'Mô hình kinh doanh',
  complianceRequirements: 'Chứng chỉ',
};

const FIELD_GUIDANCE = {
  title: 'vui lòng nhập tiêu đề yêu cầu.',
  industryTags: 'vui lòng nhập ít nhất một lĩnh vực.',
  requiredServices: 'vui lòng nhập ít nhất một dịch vụ.',
  desiredCapacity: 'vui lòng chọn quy mô nhỏ, vừa hoặc lớn.',
  businessModel: 'vui lòng chọn B2B, B2C hoặc B2B2C.',
  complianceRequirements: 'vui lòng kiểm tra danh sách chứng chỉ.',
};

const parseList = (value) => (
  typeof value === 'string'
    ? value.split(',').map((item) => item.trim()).filter(Boolean)
    : []
);

const getBuyerId = (account) => {
  const value = account?.buyerId ?? account?.id;
  return typeof value === 'string' && value.trim() ? value.trim() : 'buyer-001';
};

function validateForm(formData) {
  const errors = {};
  if (!formData.title.trim()) errors.title = 'Vui lòng nhập tiêu đề yêu cầu.';
  if (!parseList(formData.industryTags).length) errors.industryTags = 'Vui lòng nhập ít nhất một lĩnh vực.';
  if (!parseList(formData.requiredServices).length) errors.requiredServices = 'Vui lòng nhập ít nhất một dịch vụ.';
  if (!['small', 'medium', 'large'].includes(formData.desiredCapacity)) {
    errors.desiredCapacity = 'Vui lòng chọn quy mô nhỏ, vừa hoặc lớn.';
  }
  if (!['B2B', 'B2C', 'B2B2C'].includes(formData.businessModel)) {
    errors.businessModel = 'Vui lòng chọn B2B, B2C hoặc B2B2C.';
  }
  return errors;
}

function getErrorMessage(error) {
  const details = Array.isArray(error.details) ? error.details : [];
  if (details.length) {
    return details.map(({ field, message }) => {
      const label = FORM_FIELDS[field] || (field === 'buyerId' ? 'Tài khoản người mua' : field);
      return `${label}: ${FIELD_GUIDANCE[field] || message || 'vui lòng kiểm tra lại.'}`;
    }).join(' ');
  }
  if (error.status === 400) {
    return 'Thông tin yêu cầu chưa hợp lệ. Vui lòng kiểm tra các trường bắt buộc rồi thử lại.';
  }
  return error.userMessage || 'Không thể tạo yêu cầu. Vui lòng thử lại.';
}

function FieldError({ id, message }) {
  return message ? <small className="field-error" id={`${id}-error`}>{message}</small> : null;
}

function getFieldProps(field, errors) {
  return {
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': errors[field] ? `${field}-error` : undefined,
    className: `input-field${errors[field] ? ' input-invalid' : ''}`,
  };
}

export default function CreateRequestView({ onRequestCreated, account = null, supplier = null, onBack }) {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const accountTags = Array.isArray(account?.industryTags)
      ? account.industryTags
      : Array.isArray(account?.tags) ? account.tags : [];
    const supplierTags = Array.isArray(supplier?.industryTags) ? supplier.industryTags : [];
    const supplierServices = Array.isArray(supplier?.services) ? supplier.services : [];

    setFormData((current) => ({
      ...current,
      ...(accountTags.length ? { industryTags: accountTags.join(', ') } : {}),
      ...(account?.businessModel ? { businessModel: account.businessModel } : {}),
      ...(supplierTags.length ? { industryTags: supplierTags.join(', ') } : {}),
      ...(supplierServices.length ? { requiredServices: supplierServices.join(', ') } : {}),
      ...(supplier?.location ? { location: supplier.location } : {}),
      ...(supplier?.businessModel ? { businessModel: supplier.businessModel } : {}),
    }));
  }, [account, supplier]);

  const setField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
    setStatus({ type: '', message: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const errors = validateForm(formData);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setStatus({ type: 'error', message: Object.values(errors).join(' ') });
      document.getElementById(Object.keys(errors)[0])?.focus();
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    setStatus({ type: 'loading', message: '⏳ Đang gửi yêu cầu...' });

    const requestPayload = {
      buyerId: getBuyerId(account),
      title: formData.title.trim(),
      description: formData.description.trim(),
      industryTags: parseList(formData.industryTags),
      requiredServices: parseList(formData.requiredServices),
      desiredCapacity: formData.desiredCapacity,
      location: formData.location.trim(),
      complianceRequirements: parseList(formData.complianceRequirements),
      businessModel: formData.businessModel,
    };

    try {
      const request = await api.createRequest(requestPayload);
      if (!request?.id) throw new Error('Máy chủ không trả về mã yêu cầu.');
      setStatus({ type: 'success', message: `✅ Tạo yêu cầu thành công · Mã: ${request.id}. Đang mở Matching...` });
      onRequestCreated?.(request);
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const titleProps = getFieldProps('title', fieldErrors);
  const tagsProps = getFieldProps('industryTags', fieldErrors);
  const servicesProps = getFieldProps('requiredServices', fieldErrors);
  const capacityProps = getFieldProps('desiredCapacity', fieldErrors);
  const businessModelProps = getFieldProps('businessModel', fieldErrors);

  return (
    <section className="module-container">
      <div className="request-heading">
        <div>
          <h2>Tạo yêu cầu tìm đối tác</h2>
          <p className="module-desc">Mô tả nhu cầu để TRADEVIA tìm nhà cung cấp phù hợp</p>
        </div>
        {onBack && <button className="btn btn-outline" type="button" onClick={onBack}>← Quay lại</button>}
      </div>

      {supplier && (
        <aside className="request-context" aria-label="Nhà cung cấp đang chọn">
          <span aria-hidden="true">🏭</span>
          <span>
            Tạo yêu cầu liên quan đến <strong>{supplier.companyName || supplier.id}</strong>
            {supplier.location ? ` · ${supplier.location}` : ''}
          </span>
        </aside>
      )}

      <form onSubmit={handleSubmit} className="card request-form" noValidate>
        <div className="request-field">
          <label htmlFor="title">Tiêu đề yêu cầu <span aria-hidden="true">*</span></label>
          <input id="title" {...titleProps} value={formData.title} required
            onChange={(event) => setField('title', event.target.value)} />
          <FieldError id="title" message={fieldErrors.title} />
        </div>

        <div className="request-field">
          <label htmlFor="description">Mô tả chi tiết</label>
          <textarea id="description" className="input-field" rows="3" value={formData.description}
            onChange={(event) => setField('description', event.target.value)} />
        </div>

        <div className="request-form-grid request-form-grid-two">
          <div className="request-field">
            <label htmlFor="industryTags">Lĩnh vực, phân cách bằng dấu phẩy <span aria-hidden="true">*</span></label>
            <input id="industryTags" {...tagsProps} value={formData.industryTags} required
              onChange={(event) => setField('industryTags', event.target.value)} />
            <FieldError id="industryTags" message={fieldErrors.industryTags} />
          </div>
          <div className="request-field">
            <label htmlFor="requiredServices">Dịch vụ cần tìm, phân cách bằng dấu phẩy <span aria-hidden="true">*</span></label>
            <input id="requiredServices" {...servicesProps} value={formData.requiredServices} required
              onChange={(event) => setField('requiredServices', event.target.value)} />
            <FieldError id="requiredServices" message={fieldErrors.requiredServices} />
          </div>
        </div>

        <div className="request-form-grid request-form-grid-three">
          <div className="request-field">
            <label htmlFor="desiredCapacity">Quy mô mong muốn <span aria-hidden="true">*</span></label>
            <select id="desiredCapacity" {...capacityProps} value={formData.desiredCapacity} required
              onChange={(event) => setField('desiredCapacity', event.target.value)}>
              <option value="small">Nhỏ</option><option value="medium">Vừa</option><option value="large">Lớn</option>
            </select>
            <FieldError id="desiredCapacity" message={fieldErrors.desiredCapacity} />
          </div>
          <div className="request-field">
            <label htmlFor="location">Địa điểm</label>
            <input id="location" className="input-field" value={formData.location}
              onChange={(event) => setField('location', event.target.value)} />
          </div>
          <div className="request-field">
            <label htmlFor="businessModel">Mô hình kinh doanh <span aria-hidden="true">*</span></label>
            <select id="businessModel" {...businessModelProps} value={formData.businessModel} required
              onChange={(event) => setField('businessModel', event.target.value)}>
              <option value="B2B">B2B</option><option value="B2C">B2C</option><option value="B2B2C">B2B2C</option>
            </select>
            <FieldError id="businessModel" message={fieldErrors.businessModel} />
          </div>
        </div>

        <div className="request-field">
          <label htmlFor="complianceRequirements">Chứng chỉ bắt buộc, phân cách bằng dấu phẩy</label>
          <input id="complianceRequirements" className="input-field" value={formData.complianceRequirements}
            onChange={(event) => setField('complianceRequirements', event.target.value)} />
        </div>

        <div className="request-actions">
          <button type="submit" className="btn btn-primary request-submit" disabled={submitting}>
            {submitting ? '⏳ Đang gửi...' : '🚀 Tạo yêu cầu & bắt đầu Matching'}
          </button>
          {onBack && <button type="button" className="btn btn-outline" onClick={onBack} disabled={submitting}>Hủy</button>}
        </div>

        {status.message && (
          <p className={`request-status request-status-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>
            {status.message}
          </p>
        )}
      </form>
    </section>
  );
}
