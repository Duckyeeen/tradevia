import express from 'express';
import { readJSON, writeJSON } from './utils/storage.js';
import { matchSuppliers } from './services/matchingService.js';

const app = express();

app.disable('x-powered-by');
app.use(express.json());

// CORS — cho phép frontend dev server (Vite, thường ở port 5173) gọi API
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ────────────────────────────────────────────────────────
// 1. GET /api/health — Kiểm tra server
// ────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'tradevia-api' });
});

// ────────────────────────────────────────────────────────
// 2. GET /api/suppliers — Danh sách nhà cung cấp
//    Query: ?tag=electronics (lọc theo industryTags)
// ────────────────────────────────────────────────────────
app.get('/api/suppliers', async (_req, res) => {
  try {
    let suppliers = await readJSON('suppliers.json');
    const { tag } = _req.query;
    if (tag) {
      const tagLower = tag.toLowerCase();
      suppliers = suppliers.filter(
        (s) => Array.isArray(s.industryTags) && s.industryTags.some((t) => t.toLowerCase() === tagLower),
      );
    }
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read suppliers', detail: err.message });
  }
});

// ────────────────────────────────────────────────────────
// 3. GET /api/suppliers/:id — Chi tiết nhà cung cấp
// ────────────────────────────────────────────────────────
app.get('/api/suppliers/:id', async (req, res) => {
  try {
    const suppliers = await readJSON('suppliers.json');
    const supplier = suppliers.find((s) => s.id === req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read suppliers', detail: err.message });
  }
});

// ────────────────────────────────────────────────────────
// 4. GET /api/requests — Danh sách yêu cầu tìm đối tác
// ────────────────────────────────────────────────────────
app.get('/api/requests', async (_req, res) => {
  try {
    const requests = await readJSON('requests.json');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read requests', detail: err.message });
  }
});

// ────────────────────────────────────────────────────────
// 5. POST /api/requests — Tạo yêu cầu tìm đối tác mới
// ────────────────────────────────────────────────────────
app.post('/api/requests', async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Request body must be a JSON object' });
    }

    const required = ['buyerId', 'title', 'industryTags', 'requiredServices', 'desiredCapacity', 'businessModel'];
    const missing = required.filter((key) => body[key] === undefined || body[key] === null || body[key] === '');
    if (missing.length > 0) {
      return res.status(400).json({ error: 'Missing required fields', fields: missing });
    }

    const invalid = [];
    for (const key of ['buyerId', 'title', 'desiredCapacity', 'businessModel']) {
      if (typeof body[key] !== 'string' || body[key].trim() === '') invalid.push(key);
    }
    for (const key of ['industryTags', 'requiredServices']) {
      if (!Array.isArray(body[key]) || body[key].length === 0 || body[key].some((item) => typeof item !== 'string' || item.trim() === '')) {
        invalid.push(key);
      }
    }
    if (body.description !== undefined && typeof body.description !== 'string') invalid.push('description');
    if (body.location !== undefined && typeof body.location !== 'string') invalid.push('location');
    if (body.complianceRequirements !== undefined && (!Array.isArray(body.complianceRequirements)
      || body.complianceRequirements.some((item) => typeof item !== 'string' || item.trim() === ''))) {
      invalid.push('complianceRequirements');
    }
    const capacity = typeof body.desiredCapacity === 'string' ? body.desiredCapacity.trim().toLowerCase() : '';
    if (capacity && !['small', 'medium', 'large'].includes(capacity)) invalid.push('desiredCapacity');
    const businessModel = typeof body.businessModel === 'string' ? body.businessModel.trim().toUpperCase() : '';
    if (businessModel && !['B2B', 'B2C', 'B2B2C'].includes(businessModel)) invalid.push('businessModel');
    if (invalid.length > 0) {
      return res.status(400).json({ error: 'Invalid request fields', fields: [...new Set(invalid)] });
    }

    const requests = await readJSON('requests.json');

    // Sinh id duy nhất
    const maxNum = requests.reduce((max, r) => {
      const match = r.id?.match(/^request-(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    const newId = `request-${String(maxNum + 1).padStart(3, '0')}`;

    const newRequest = {
      id: newId,
      buyerId: body.buyerId.trim(),
      title: body.title.trim(),
      description: body.description?.trim() || '',
      industryTags: body.industryTags.map((tag) => tag.trim()),
      requiredServices: body.requiredServices.map((service) => service.trim()),
      desiredCapacity: capacity,
      location: body.location?.trim() || '',
      complianceRequirements: (body.complianceRequirements || []).map((requirement) => requirement.trim()),
      businessModel,
    };

    requests.push(newRequest);
    await writeJSON('requests.json', requests);
    res.status(201).json(newRequest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create request', detail: err.message });
  }
});

// ────────────────────────────────────────────────────────
// 6. POST /api/matching — Chạy thuật toán matching
//    Body: { "requestId": "request-001" }
// ────────────────────────────────────────────────────────
app.post('/api/matching', async (req, res) => {
  try {
    const requestId = req.body?.requestId;
    if (typeof requestId !== 'string' || requestId.trim() === '') {
      return res.status(400).json({ error: 'Missing requestId' });
    }

    const requests = await readJSON('requests.json');
    const request = requests.find((r) => r.id === requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const suppliers = await readJSON('suppliers.json');

    let results;
    try {
      results = matchSuppliers(request, suppliers);
    } catch (err) {
      if (err instanceof TypeError) {
        return res.status(400).json({ error: err.message });
      }
      throw err;
    }

    res.json({ requestId, results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to run matching', detail: err.message });
  }
});

// ────────────────────────────────────────────────────────
// 7. GET /api/connections — Danh sách kết nối
//    Query: ?buyerId=... hoặc ?supplierId=...
// ────────────────────────────────────────────────────────
app.get('/api/connections', async (req, res) => {
  try {
    let connections = await readJSON('connections.json');
    const { buyerId, supplierId } = req.query;
    if (buyerId) connections = connections.filter((c) => c.buyerId === buyerId);
    if (supplierId) connections = connections.filter((c) => c.supplierId === supplierId);
    res.json(connections);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read connections', detail: err.message });
  }
});

// ────────────────────────────────────────────────────────
// 8. POST /api/connections — Tạo yêu cầu kết nối
// ────────────────────────────────────────────────────────
app.post('/api/connections', async (req, res) => {
  try {
    const { requestId, buyerId, supplierId } = req.body || {};

    if ([requestId, buyerId, supplierId].some((value) => typeof value !== 'string' || value.trim() === '')) {
      return res.status(400).json({ error: 'Missing required fields', fields: ['requestId', 'buyerId', 'supplierId'] });
    }

    const normalizedRequestId = requestId.trim();
    const normalizedBuyerId = buyerId.trim();
    const normalizedSupplierId = supplierId.trim();
    const [requests, suppliers] = await Promise.all([readJSON('requests.json'), readJSON('suppliers.json')]);
    const request = requests.find((item) => item.id === normalizedRequestId);
    if (!request) return res.status(404).json({ error: 'Request not found', requestId: normalizedRequestId });
    const supplier = suppliers.find((item) => item.id === normalizedSupplierId);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found', supplierId: normalizedSupplierId });
    if (request.buyerId !== normalizedBuyerId) {
      return res.status(400).json({ error: 'Buyer does not own this request', fields: ['buyerId'] });
    }

    const connections = await readJSON('connections.json');

    // Kiểm tra trùng lặp (cùng requestId + supplierId)
    const duplicate = connections.find((c) => c.requestId === normalizedRequestId && c.supplierId === normalizedSupplierId);
    if (duplicate) {
      return res.status(409).json({ error: 'Connection already exists', existingId: duplicate.id });
    }

    // Sinh id duy nhất
    const maxNum = connections.reduce((max, c) => {
      const match = c.id?.match(/^connection-(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    const newId = `connection-${String(maxNum + 1).padStart(3, '0')}`;

    const newConnection = {
      id: newId,
      requestId: normalizedRequestId,
      buyerId: normalizedBuyerId,
      supplierId: normalizedSupplierId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    connections.push(newConnection);
    await writeJSON('connections.json', connections);
    res.status(201).json(newConnection);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create connection', detail: err.message });
  }
});

// ────────────────────────────────────────────────────────
export { app };
