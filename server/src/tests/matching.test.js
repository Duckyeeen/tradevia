import test from 'node:test';
import assert from 'node:assert/strict';
import {
  matchSuppliers, computeTotal, scoreCapacity, scoreLocation, scoreCompliance, scoreBusinessModel, scoreTags,
} from '../services/matchingService.js';
import { WEIGHTS, CRITERIA } from '../services/matchingConfig.js';
import { normalizeText, normalizeCertification } from '../utils/normalize.js';
import * as F from './fixtures/matchingFixtures.js';

const byId = (results) => Object.fromEntries(results.map((r) => [r.supplierId, r]));
const deepFreeze = (o) => { Object.values(o).forEach((v) => typeof v === 'object' && v && deepFreeze(v)); return Object.freeze(o); };

test('normalize: bỏ dấu, hoa/thường, khoảng trắng, đ', () => {
  assert.equal(normalizeText('  Đà   Nẵng '), 'da nang');
  assert.equal(normalizeText('\ufeffHà Nội'), 'ha noi');
  assert.equal(normalizeText(null), '');
  assert.equal(normalizeCertification('ISO 9001:2015'), 'iso9001');
  assert.equal(normalizeCertification('iso-9001'), 'iso9001');
});

test('REQUEST_FULL: điểm, breakdown, missingData khớp đáp án tính tay', () => {
  const got = byId(matchSuppliers(F.REQUEST_FULL, F.SUPPLIERS));
  for (const [id, expected] of Object.entries(F.EXPECTED_FULL)) {
    assert.deepEqual(got[id], { supplierId: id, ...expected }, id);
  }
});

test('REQUEST_FULL: thứ tự sắp xếp + tie-break (score > tags > supplierId)', () => {
  const order = matchSuppliers(F.REQUEST_FULL, F.SUPPLIERS).map((r) => r.supplierId);
  assert.deepEqual(order, F.EXPECTED_ORDER_FULL);
});

test('REQUEST_PARTIAL: thiếu phía request, không yêu cầu chứng chỉ', () => {
  const got = byId(matchSuppliers(F.REQUEST_PARTIAL, F.SUPPLIERS));
  for (const [id, expected] of Object.entries(F.EXPECTED_PARTIAL)) {
    assert.deepEqual(got[id], { supplierId: id, ...expected }, id);
  }
});

test('capacity: 0/1/2 cấp lệch', () => {
  const s = (c) => ({ capacity: c });
  assert.equal(scoreCapacity({ desiredCapacity: 'small' }, s('small')).score, 100);
  assert.equal(scoreCapacity({ desiredCapacity: 'medium' }, s('large')).score, 50);
  assert.equal(scoreCapacity({ desiredCapacity: 'small' }, s('large')).score, 0);
  assert.deepEqual(scoreCapacity({ desiredCapacity: 'small' }, s('huge')).missing, ['supplier.capacity']);
});

test('location: alias, quốc gia, khác quốc gia, nơi lạ', () => {
  const L = (a, b) => scoreLocation({ location: a }, { location: b }).score;
  assert.equal(L('Đà Nẵng', 'danang'), 100);
  assert.equal(L('Da Nang', 'Hanoi'), 75);
  assert.equal(L('Vietnam', 'Da Nang'), 75);
  assert.equal(L('Vietnam', 'Viet Nam'), 100);
  assert.equal(L('Da Nang', 'Bangkok'), 0);
  assert.equal(L('Vietnam', 'Ho Chi Minh City, Vietnam'), 75);
  assert.equal(L('Hanoi', 'Ha Noi - Viet Nam'), 100);
  assert.equal(L('Vietnam', 'Lot 5, Hoa Khanh Industrial Park, Da Nang'), 75);
  assert.equal(L('Da Nang', 'Da Nang, Vietnam'), 100);
  assert.equal(L('Vietnam', 'Bangkok, Thailand'), 0);
  assert.equal(L('Vietnam', 'Austin Industrial Park'), 0);
  assert.equal(L('Vietnam', 'Hanoi, Thailand'), 0);
  assert.equal(L('Hanoi, Thailand', 'Hanoi, Thailand'), 0);
  assert.equal(L('Atlantis', 'Atlantis'), 100);
  assert.equal(L('Atlantis', 'Vietnam'), 0);
  assert.deepEqual(scoreLocation({ location: '  ' }, { location: 'Hue' }).missing, ['request.location']);
});

test('location: địa chỉ nhiều thành phần cho dữ liệu seed, kết quả đối xứng', () => {
  const cases = [
    ['Vietnam', 'Ho Chi Minh City, Vietnam', 75],
    ['Vietnam', 'Da Nang, Vietnam', 75],
    ['Vietnam', 'Bangkok, Thailand', 0],
    ['Da Nang', 'Lot 5, Hoa Khanh Industrial Park, Da Nang', 100],
  ];

  for (const [a, b, expected] of cases) {
    assert.equal(scoreLocation({ location: a }, { location: b }).score, expected, `${a} ↔ ${b}`);
    assert.equal(scoreLocation({ location: b }, { location: a }).score, expected, `${b} ↔ ${a}`);
  }
});

test('compliance: không yêu cầu / chưa khai báo / khai báo rỗng / một phần', () => {
  assert.deepEqual(scoreCompliance({ complianceRequirements: [] }, { certifications: null }), { score: 100, missing: [] });
  assert.deepEqual(scoreCompliance({ complianceRequirements: ['ISO 9001'] }, {}), { score: 0, missing: ['supplier.certifications'] });
  assert.deepEqual(scoreCompliance({ complianceRequirements: ['ISO 9001'] }, { certifications: [] }), { score: 0, missing: [] });
  assert.equal(scoreCompliance({ complianceRequirements: ['ISO 9001', 'ISO 14001'] }, { certifications: ['iso-9001'] }).score, 50);
});

test('businessModel & tags: làm tròn và dữ liệu lạ', () => {
  assert.equal(scoreBusinessModel({ businessModel: 'b2b' }, { businessModel: 'B2B' }).score, 100);
  assert.deepEqual(scoreBusinessModel({ businessModel: 'B2B' }, { businessModel: 'foo' }).missing, ['supplier.businessModel']);
  assert.equal(scoreTags({ industryTags: ['a', 'b', 'c'] }, { industryTags: ['a'] }).score, 33);
  assert.equal(scoreTags({ industryTags: ['a', 'a'] }, { industryTags: ['A'] }).score, 100); // loại trùng
  assert.deepEqual(scoreTags({ industryTags: ['a'] }, { industryTags: [] }).missing, ['supplier.industryTags']);
});

test('computeTotal: round half up bằng số nguyên', () => {
  const all = (n) => Object.fromEntries(CRITERIA.map((k) => [k, n]));
  assert.equal(computeTotal(all(100)), 100);
  assert.equal(computeTotal(all(0)), 0);
  assert.equal(computeTotal({ ...all(0), location: 75, compliance: 100, businessModel: 100 }), 28); // 2750/100=27.5 -> 28
});

test('bất biến: 6 key số nguyên 0-100, score = công thức, không mutate input, tất định', () => {
  const req = deepFreeze(structuredClone(F.REQUEST_FULL));
  const sup = deepFreeze(structuredClone(F.SUPPLIERS));
  const r1 = matchSuppliers(req, sup);
  const r2 = matchSuppliers(req, sup);
  assert.deepEqual(r1, r2);
  assert.equal(Object.values(WEIGHTS).reduce((a, b) => a + b, 0), 100);
  for (const r of r1) {
    assert.deepEqual(Object.keys(r.breakdown), CRITERIA);
    for (const v of Object.values(r.breakdown)) assert.ok(Number.isInteger(v) && v >= 0 && v <= 100);
    assert.equal(r.score, computeTotal(r.breakdown));
    assert.deepEqual(Object.keys(r), ['supplierId', 'score', 'breakdown', 'missingData']);
  }
});

test('đầu vào xấu', () => {
  assert.throws(() => matchSuppliers(null, []), TypeError);
  assert.throws(() => matchSuppliers({}, null), TypeError);
  assert.deepEqual(matchSuppliers(F.REQUEST_FULL, []), []);
  assert.equal(matchSuppliers(F.REQUEST_FULL, [null, {}, { id: '' }, { id: 'x' }]).length, 1);
  const empty = matchSuppliers({}, [{ id: 'x' }])[0]; // mọi thứ thiếu vẫn không crash, score trong 0..100
  assert.ok(empty.score >= 0 && empty.score <= 100);
});

