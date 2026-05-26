// ──────────────────────────────────────────────────────────────────────
// FAITH AUTH — Supabase email/password authentication
// 
// SETUP (you, the SaaS owner — one-time, ~10 minutes):
//   1. Sign up free at https://supabase.com
//   2. Create a new project (any name, any region)
//   3. Get your project URL + anon key from Settings → API
//   4. Paste them below where it says SUPABASE_URL and SUPABASE_ANON_KEY
//   5. In Supabase → SQL Editor, run the schema in faith-schema.sql
//   6. Done. Customers can now sign up directly.
//
// PRO TIP: To add a paywall later, just add a `subscribed` column on
// the `profiles` table and check it in App() before showing the dashboard.
// ──────────────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://ppzwxvmdoemfxfzrwpkz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwend4dm1kb2VtZnhmenJ3cGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNzE4NzIsImV4cCI6MjA5NDg0Nzg3Mn0.uje8FmVTcvCYHpnsUhG0lCF257uKzXo8MQRoHsIiaI8';

// Expose globals so dashboard.html (which uses Babel-transpiled JSX) can read them
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

// Lightweight Supabase client wrapper (no SDK dependency — pure fetch)
const auth = {
  _accessToken: () => localStorage.getItem('faith_access_token') || null,
  _refreshToken: () => localStorage.getItem('faith_refresh_token') || null,
  _setSession(session) {
    if (session?.access_token) localStorage.setItem('faith_access_token', session.access_token);
    if (session?.refresh_token) localStorage.setItem('faith_refresh_token', session.refresh_token);
    if (session?.user) localStorage.setItem('faith_user', JSON.stringify(session.user));
  },
  _clear() {
    ['faith_access_token','faith_refresh_token','faith_user'].forEach(k => localStorage.removeItem(k));
  },
  user() {
    try { return JSON.parse(localStorage.getItem('faith_user') || 'null'); }
    catch(e) { return null; }
  },
  async signUp(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error_description || 'Sign up failed');
    if (data.access_token) this._setSession(data);
    return data;
  },
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error_description || 'Sign in failed');
    this._setSession(data);
    return data;
  },
  async signOut() {
    const token = this._accessToken();
    if (token) {
      try {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
        });
      } catch(e) {}
    }
    this._clear();
  },
  async resetPassword(email) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.msg || 'Could not send reset email');
    }
  },
};

// Expose to window so the Babel-transpiled dashboard can call it
window.auth = auth;
