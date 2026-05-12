const SESSION_ID = Math.random().toString(36).slice(2);
const SUPABASE_URL = 'https://ukhjkkzioghjzpjfetad.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6JdNA_DOHOhLIn5o0GT06Q_t3Wmh--a';

export async function logEvent(type, value = '', spotIndex = null) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ type, value, spot_index: spotIndex, session_id: SESSION_ID }),
    });
  } catch (err) {}
}