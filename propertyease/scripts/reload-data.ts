/**
 * Hot-reload script — calls the embedded reset endpoint to refresh the in-memory
 * fallback bundle without needing to kill the dev server.
 */
async function main() {
  console.log('Reloading fallback data into running server...');
  try {
    const res = await fetch('http://localhost:3000/api/debug/reset', { method: 'POST' });
    const data = await res.json();
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e)); console.error('Failed:', err.message);
    console.log('\nPlease restart the dev server (Ctrl+C then npm run dev) to load fresh data.');
    process.exit(1);
  }
}
main();
