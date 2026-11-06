// Lỗi chuẩn hoá cho mọi lời gọi API. UI chỉ cần kiểm tra status/code.
//   status 0      : không tới được server (NETWORK_ERROR, TIMEOUT, ABORTED)
//   400           : VALIDATION_ERROR (details: [{ field, message }])
//   404           : NOT_FOUND
//   409           : CONFLICT (vd: connection đã tồn tại)
//   BAD_RESPONSE  : server trả dữ liệu không phải JSON (thường do proxy sai / backend chưa chạy)
export class ApiError extends Error {
  constructor({ status = 0, code = 'UNKNOWN_ERROR', message = 'Unexpected error', details = [] } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = Array.isArray(details) ? details : [];
  }

  get isNetworkError() {
    return ['NETWORK_ERROR', 'TIMEOUT', 'BAD_RESPONSE'].includes(this.code);
  }

  // Thông điệp thân thiện để hiển thị thẳng lên UI
  get userMessage() {
    switch (this.code) {
      case 'NETWORK_ERROR':
      case 'BAD_RESPONSE':
        return 'Không kết nối được máy chủ. Hãy kiểm tra backend đã chạy (npm run dev) chưa.';
      case 'TIMEOUT':
        return 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.';
      case 'NOT_FOUND':
        return 'Không tìm thấy dữ liệu yêu cầu.';
      case 'CONFLICT':
        return 'Dữ liệu đã tồn tại (ví dụ: đã gửi kết nối cho nhà cung cấp này).';
      case 'VALIDATION_ERROR':
        return this.details.length
          ? this.details.map((d) => d.message || String(d)).join('; ')
          : this.message;
      default:
        return this.message;
    }
  }
}

