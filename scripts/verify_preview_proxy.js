async function testProxy() {
  console.log('Testing Vite Preview Server on http://127.0.0.1:4173 ...');

  // 1. Test static HTML response
  const htmlRes = await fetch('http://127.0.0.1:4173/');
  console.log(`GET / status: ${htmlRes.status} ${htmlRes.statusText}`);
  const htmlText = await htmlRes.text();
  console.log(`HTML Title match: ${htmlText.includes('<title>')}`);

  // 2. Test /api proxy to port 8000
  console.log('\nTesting /api proxy to FastAPI on port 8000 ...');
  const apiRes = await fetch('http://127.0.0.1:4173/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'hello', history: [] }),
  });
  console.log(`POST /api/ai/chat status: ${apiRes.status}`);
  const apiData = await apiRes.json();
  console.log('API Response:', apiData);

  if (apiRes.status === 200 && apiData.answer) {
    console.log('\n[PASS] Test 1: Vite preview cleanly proxies /api to port 8000 backend!');
  } else {
    console.error('\n[FAIL] Test 1: Proxy did not return expected response.');
    process.exit(1);
  }
}

testProxy().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});

