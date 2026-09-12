import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Load users from .data/fallback.json on demand.
 *
 * This is needed because the auth route does NOT import database.ts,
 * so globalThis.__PE_FALLBACK__ is never initialized before this function runs.
 * Reading directly from the JSON file guarantees we always have the users
 * available even when Supabase is configured but the users table is empty
 * or missing required columns.
 */
function loadFallbackUsers(): any[] {
  try {
    const fs = require('fs');
    const path = require('path');
    // Check both possible cwd locations
    const candidates = [
      path.join(process.cwd(), '.data', 'fallback.json'),
      path.join(process.cwd(), 'propertyease', '.data', 'fallback.json'),
    ];
    for (const fp of candidates) {
      if (fs.existsSync(fp)) {
        const raw = JSON.parse(fs.readFileSync(fp, 'utf8'));
        if (raw?.users && Array.isArray(raw.users)) return raw.users;
      }
    }
  } catch { /* ignore */ }
  return [];
}

export async function getUserByEmail(email: string) {
  // 1) Try Supabase; if it errors or returns nothing, drop through to JSON fallback
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, password, name, name_ar, role, is_active')
        .eq('email', email)
        .single();
      if (!error && data) return data;
    } catch { /* Supabase unavailable or schema mismatch — fall through */ }
  }
  // 2) Fallback: read users directly from .data/fallback.json
  const users = loadFallbackUsers();
  if (!users.length) return null;
  return users.find((u: any) => u.email === email) ?? null;
}

async function createUserFromGoogle(profile: { id: string; email: string; name: string; email_verified?: boolean; picture?: string }) {
  const existing = await getUserByEmail(profile.email);
  if (existing) return existing;

  const hash = await bcrypt.hash('google-temp-' + Date.now(), 10);
  const newUser = {
    id: 'auth_google_' + profile.id + '_' + Date.now(),
    email: profile.email,
    password: hash, // dummy hash — Google users don't have passwords
    name: profile.name,
    name_ar: null,
    role: 'manager' as const,
    avatar: profile.picture || null,
    isActive: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (supabaseUrl && supabaseAnonKey) {
    const { data } = await supabase.from('users').insert(newUser).select().single();
    return data || newUser;
  }
  // Write into fallback bundle so it persists
  try {
    const b: any = globalThis.__PE_FALLBACK__;
    if (b?.users) { b.users.push(newUser); }
  } catch {}
  return newUser;
}

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const { email, password } = credentials as { email: string; password: string };

        const user = await getUserByEmail(email);
        if (!user) return null; // used by NextAuth to show "invalid credentials"
        if (!user.isActive) return null;

        // Allow demo mode: if NEXTAUTH_DEMO=true and password is "demo", auto-create session
        if (process.env.NEXTAUTH_DEMO === 'true' && password === 'demo') {
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  session: { strategy: 'jwt' as const },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      if (account && account.provider === 'google') {
        // On Google sign-in, look up or create the user in our users table
        const profile = {
          id: account.providerAccountId,
          email: token.email || '',
          name: token.name || '',
          email_verified: token.email_verified || false,
          picture: token.picture || undefined,
        };
        try {
          const createdUser = await createUserFromGoogle(profile);
          token.id = createdUser.id;
          token.role = createdUser.role;
          token.name = createdUser.name;
        } catch (e) {
          console.error('[NextAuth] Google user creation failed:', e);
        }
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      session.user = session.user || {};
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.name = token.name;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions as any);
export { handler as GET, handler as POST };
