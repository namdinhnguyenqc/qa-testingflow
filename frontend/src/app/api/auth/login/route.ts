import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001/api';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // In mock mode, accept any non-empty email+password
  if (process.env.NEXT_PUBLIC_API_MOCK === 'true') {
    if (body.email === 'admin@gmail.com' && body.password === 'Abc@1234') {
      const res = NextResponse.json({ ok: true });
      res.cookies.set('auth-token', 'mock-token', { httpOnly: true, path: '/', sameSite: 'lax' });
      return res;
    }
    return NextResponse.json({ message: 'Email hoặc mật khẩu không đúng' }, { status: 401 });
  }

  try {
    const upstream = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return NextResponse.json(data, { status: upstream.status });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set('auth-token', data.token, { httpOnly: true, path: '/', sameSite: 'lax' });
    return res;
  } catch {
    return NextResponse.json({ message: 'Lỗi máy chủ' }, { status: 500 });
  }
}
