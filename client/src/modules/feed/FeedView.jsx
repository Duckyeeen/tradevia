import { useEffect, useMemo, useState } from 'react';
import { getSuppliers } from '../../services/api.js';
import MOCK_POSTS from './postData.js';

const RECOMMENDED_FILTER = 'recommended';
const ALL_FILTER = 'all';
const VIEW_POSTS = 'posts';
const VIEW_SUPPLIERS = 'suppliers';

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
}

function getErrorMessage(error) {
  if (error?.userMessage) return error.userMessage;
  if (error?.status === 0) return 'Không thể kết nối dữ liệu nhà cung cấp. Vui lòng thử lại.';
  return error?.message || 'Đã xảy ra lỗi khi tải danh sách nhà cung cấp.';
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function FeedView({ onSelectSupplier, industryTags = [] }) {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(RECOMMENDED_FILTER);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [activeView, setActiveView] = useState(VIEW_POSTS);

  const accountTags = useMemo(
    () => [...new Set((Array.isArray(industryTags) ? industryTags : []).filter(Boolean))],
    [industryTags],
  );

  // ---------- Load suppliers từ API ----------
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    getSuppliers({}, { signal: controller.signal })
      .then((data) => {
        setSuppliers(Array.isArray(data) ? data : []);
      })
      .catch((requestError) => {
        if (requestError?.code === 'ABORTED') return;
        setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  // ---------- Tags có sẵn từ cả account + supplier + post ----------
  const availableTags = useMemo(() => {
    const tags = new Map();
    [
      ...accountTags,
      ...suppliers.flatMap((s) => s.industryTags ?? []),
      ...MOCK_POSTS.flatMap((p) => p.tags ?? []),
    ]
      .filter((tag) => typeof tag === 'string' && tag.trim())
      .forEach((tag) => tags.set(normalize(tag), tag.trim()));
    return [...tags.values()].sort((a, b) => a.localeCompare(b));
  }, [accountTags, suppliers]);

  // ---------- Lọc supplier ----------
  const visibleSuppliers = useMemo(() => {
    const query = normalize(searchTerm);
    const normalizedAccountTags = new Set(accountTags.map(normalize));

    return suppliers.filter((supplier) => {
      const supplierTags = (supplier.industryTags ?? []).map(normalize);
      const matchesFilter = selectedFilter === RECOMMENDED_FILTER
        ? normalizedAccountTags.size === 0 || supplierTags.some((tag) => normalizedAccountTags.has(tag))
        : selectedFilter === ALL_FILTER || supplierTags.includes(normalize(selectedFilter));

      if (!matchesFilter) return false;
      if (!query) return true;

      const searchableText = [
        supplier.companyName,
        supplier.description,
        supplier.location,
        ...(supplier.services ?? []),
        ...(supplier.industryTags ?? []),
      ].map(normalize).join(' ');

      return searchableText.includes(query);
    });
  }, [accountTags, searchTerm, selectedFilter, suppliers]);

  // ---------- Lọc và sắp xếp posts (ưu tiên theo account tags) ----------
  const visiblePosts = useMemo(() => {
    const query = normalize(searchTerm);
    const normalizedAccountTags = new Set(accountTags.map(normalize));

    const filtered = MOCK_POSTS.filter((post) => {
      const postTags = (post.tags ?? []).map(normalize);
      const matchesFilter = selectedFilter === RECOMMENDED_FILTER
        ? normalizedAccountTags.size === 0 || postTags.some((tag) => normalizedAccountTags.has(tag))
        : selectedFilter === ALL_FILTER || postTags.includes(normalize(selectedFilter));

      if (!matchesFilter) return false;
      if (!query) return true;

      const searchableText = [
        post.authorName,
        post.title,
        post.content,
        ...(post.tags ?? []),
      ].map(normalize).join(' ');

      return searchableText.includes(query);
    });

    // Sắp xếp: post có nhiều tag trùng account tags lên trước
    return filtered.sort((a, b) => {
      if (normalizedAccountTags.size === 0) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      const scoreA = (a.tags ?? []).filter((t) => normalizedAccountTags.has(normalize(t))).length;
      const scoreB = (b.tags ?? []).filter((t) => normalizedAccountTags.has(normalize(t))).length;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [accountTags, searchTerm, selectedFilter]);

  // ---------- Render helpers ----------
  const filterButton = (value, label) => (
    <button
      key={value}
      type="button"
      className={`btn ${selectedFilter === value ? 'btn-primary' : 'btn-outline'}`}
      aria-pressed={selectedFilter === value}
      onClick={() => setSelectedFilter(value)}
    >
      {label}
    </button>
  );

  const viewTab = (view, label, emoji) => (
    <button
      type="button"
      className={`btn ${activeView === view ? 'btn-primary' : 'btn-outline'}`}
      onClick={() => setActiveView(view)}
      style={{ flex: 1 }}
    >
      {emoji} {label}
    </button>
  );

  return (
    <div className="module-container">
      <h2>Bảng tin &amp; Khám phá đối tác</h2>
      <p className="module-desc">Tìm nhà cung cấp theo lĩnh vực, dịch vụ và nhu cầu của bạn.</p>

      {/* ---------- Toggle: Bài đăng / Nhà cung cấp ---------- */}
      <div style={{ display: 'flex', gap: '8px', margin: '12px 0 18px' }}>
        {viewTab(VIEW_POSTS, 'Bài đăng', '📰')}
        {viewTab(VIEW_SUPPLIERS, 'Nhà cung cấp', '🏭')}
      </div>

      {/* ---------- Search & Filter ---------- */}
      <section aria-label="Tìm kiếm và lọc" style={{ margin: '0 0 20px' }}>
        <label htmlFor="feed-search" style={{ display: 'block', marginBottom: '7px', fontSize: '13px', fontWeight: 600 }}>
          {activeView === VIEW_POSTS ? 'Tìm bài đăng' : 'Tìm nhà cung cấp'}
        </label>
        <input
          id="feed-search"
          type="search"
          placeholder={
            activeView === VIEW_POSTS
              ? 'Tìm theo tiêu đề, nội dung, tác giả...'
              : 'Tên công ty, lĩnh vực, dịch vụ hoặc địa điểm...'
          }
          className="input-field"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <div aria-label="Lọc theo lĩnh vực" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
          {filterButton(RECOMMENDED_FILTER, accountTags.length ? 'Gợi ý cho bạn' : 'Tất cả')}
          {accountTags.length > 0 && filterButton(ALL_FILTER, 'Tất cả')}
          {availableTags.map((tag) => filterButton(tag, `#${tag}`))}
        </div>

        {accountTags.length > 0 && (
          <p style={{ color: '#60716b', fontSize: '12px', margin: '10px 0 0' }}>
            Gợi ý dựa trên lĩnh vực tài khoản: {accountTags.map((tag) => `#${tag}`).join(', ')}
          </p>
        )}
      </section>

      {/* ==================== VIEW: BÀI ĐĂNG ==================== */}
      {activeView === VIEW_POSTS && (
        <>
          {visiblePosts.length === 0 ? (
            <div className="card" role="status">
              <h3 style={{ marginBottom: '8px' }}>Chưa có bài đăng phù hợp</h3>
              <p style={{ color: '#60716b', marginBottom: '12px' }}>
                Thử đổi từ khóa hoặc chọn lĩnh vực khác để xem thêm bài đăng.
              </p>
              {selectedFilter !== ALL_FILTER && filterButton(ALL_FILTER, 'Xem tất cả bài đăng')}
            </div>
          ) : (
            <>
              <p aria-live="polite" style={{ color: '#60716b', fontSize: '13px', marginBottom: '12px' }}>
                {visiblePosts.length} bài đăng
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {visiblePosts.map((post) => (
                  <article key={post.id} className="card" style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '15px', color: '#1a3c34' }}>
                        {post.authorName}
                      </span>
                      <span style={{ fontSize: '12px', color: '#999' }}>
                        {post.authorType === 'business' ? '🏢 Doanh nghiệp' : '👤 Cá nhân'}
                        {post.createdAt ? ` · ${formatDate(post.createdAt)}` : ''}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '16px', margin: '0 0 8px', color: '#0d2b24' }}>{post.title}</h3>
                    <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#3d4f49', margin: '0 0 12px' }}>
                      {post.content}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {(post.tags ?? []).map((tag) => (
                        <span key={tag} className="tag-pill">#{tag}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ==================== VIEW: NHÀ CUNG CẤP ==================== */}
      {activeView === VIEW_SUPPLIERS && (
        <>
          {loading ? (
            <p role="status" aria-live="polite">Đang tải nhà cung cấp...</p>
          ) : error ? (
            <div className="card" role="alert" style={{ borderColor: '#f0c6bd' }}>
              <p style={{ marginBottom: '12px' }}>{error}</p>
              <button className="btn btn-outline" type="button" onClick={() => setReloadKey((key) => key + 1)}>
                Thử tải lại
              </button>
            </div>
          ) : visibleSuppliers.length === 0 ? (
            <div className="card" role="status">
              <h3 style={{ marginBottom: '8px' }}>Chưa tìm thấy nhà cung cấp phù hợp</h3>
              <p style={{ color: '#60716b', marginBottom: '12px' }}>
                Thử đổi từ khóa hoặc chọn lĩnh vực khác để xem thêm kết quả.
              </p>
              {selectedFilter !== ALL_FILTER && filterButton(ALL_FILTER, 'Xem tất cả nhà cung cấp')}
            </div>
          ) : (
            <>
              <p aria-live="polite" style={{ color: '#60716b', fontSize: '13px', marginBottom: '12px' }}>
                Tìm thấy {visibleSuppliers.length} nhà cung cấp
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
                {visibleSuppliers.map((supplier) => (
                  <article key={supplier.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '17px', marginBottom: '6px' }}>{supplier.companyName || 'Nhà cung cấp'}</h3>
                    <p style={{ fontSize: '13px', color: '#60716b', margin: '0 0 8px' }}>
                      📍 {supplier.location || 'Chưa cập nhật địa điểm'}
                    </p>
                    <p style={{ fontSize: '14px', lineHeight: 1.55, margin: '0 0 10px' }}>
                      {supplier.description || 'Nhà cung cấp chưa có mô tả.'}
                    </p>
                    {(supplier.services ?? []).length > 0 && (
                      <p style={{ fontSize: '12px', color: '#60716b', margin: '0 0 8px' }}>
                        Dịch vụ: {supplier.services.join(', ')}
                      </p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', margin: 'auto 0 8px' }}>
                      {(supplier.industryTags ?? []).map((tag) => (
                        <span key={tag} className="tag-pill">#{tag}</span>
                      ))}
                    </div>
                    {onSelectSupplier && (
                      <button
                        className="btn btn-primary"
                        type="button"
                        style={{ width: '100%', marginTop: '8px' }}
                        onClick={() => onSelectSupplier(supplier.id)}
                      >
                        Xem hồ sơ nhà cung cấp
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
