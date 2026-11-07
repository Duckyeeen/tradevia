import test from 'node:test';
import assert from 'node:assert/strict';
import MOCK_POSTS from './postData.js';
import { getCurrentAccount, selectDemoAccount, updateCurrentAccount } from '../account/accountStore.js';

test('postData: có ít nhất 5 bài đăng mock với đầy đủ trường dữ liệu', () => {
  assert.ok(Array.isArray(MOCK_POSTS));
  assert.ok(MOCK_POSTS.length >= 5);
  for (const post of MOCK_POSTS) {
    assert.ok(post.id, 'Post cần có id');
    assert.ok(post.title, 'Post cần có title');
    assert.ok(post.authorName, 'Post cần có authorName');
    assert.ok(Array.isArray(post.tags) && post.tags.length > 0, 'Post cần có tags');
  }
});

test('feed: kết nối trực tiếp với accountStore để phản ánh industryTags khi đổi tài khoản', () => {
  selectDemoAccount('buyer-001');
  const businessAccount = getCurrentAccount();
  assert.equal(businessAccount.id, 'buyer-001');
  assert.deepEqual(businessAccount.industryTags, ['electronics', 'manufacturing']);

  // Khi lọc post theo tags của buyer-001
  const matchingPosts = MOCK_POSTS.filter((post) =>
    post.tags.some((tag) => businessAccount.industryTags.includes(tag))
  );
  assert.ok(matchingPosts.length > 0, 'Cần có bài đăng khớp với tags tài khoản');

  // Đổi sang tài khoản khác
  selectDemoAccount('buyer-002');
  const personalAccount = getCurrentAccount();
  assert.equal(personalAccount.id, 'buyer-002');

  // Khôi phục lại tài khoản mặc định
  selectDemoAccount('buyer-001');
});
