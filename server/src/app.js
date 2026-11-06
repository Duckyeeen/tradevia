import express from 'express';
import { readJSON, writeJSON } from './utils/storage.js';
import { matchSuppliers } from './services/matchingService.js';

const app = express();
const port = Number(process.env.PORT) || 3000;

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

    // Validate các trường bắt buộc
    const required = ['title', 'industryTags', 'requiredServices', 'desiredCapacity', 'businessModel'];
    const missing = required.filter((key) => body[key] === undefined || body[key] === null || body[key] === '');
    if (missing.length > 0) {
      return res.status(400).json({ error: 'Missing required fields', fields: missing });
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
      buyerId: body.buyerId || null,
      title: body.title,
      description: body.description || '',
      industryTags: body.industryTags,
      requiredServices: body.requiredServices,
      desiredCapacity: body.desiredCapacity,
      location: body.location || '',
      complianceRequirements: body.complianceRequirements || [],
      businessModel: body.businessModel,
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
    const { requestId } = req.body;
    if (!requestId) {
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
    const { requestId, buyerId, supplierId } = req.body;

    // Validate
    if (!requestId || !buyerId || !supplierId) {
      return res.status(400).json({ error: 'Missing required fields', fields: ['requestId', 'buyerId', 'supplierId'] });
    }

    const connections = await readJSON('connections.json');

    // Kiểm tra trùng lặp (cùng requestId + supplierId)
    const duplicate = connections.find((c) => c.requestId === requestId && c.supplierId === supplierId);
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
      requestId,
      buyerId,
      supplierId,
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
// Start server
// ────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`TRADEVIA API listening at http://localhost:${port}`);
});
