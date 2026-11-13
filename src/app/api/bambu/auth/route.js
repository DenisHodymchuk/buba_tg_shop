import { NextResponse } from 'next/server';
import {
  getBambuBaseUrl,
  getBambuHeaders,
  parseUidFromJwt,
  fetchBambuProfile,
  fetchBambuBindDevices,
  saveBambuAuth,
  clearBambuAuth
} from '@/lib/bambuCloud';

export const dynamic = 'force-dynamic';

async function finalizeBambuLogin({ accessToken, refreshToken, email, region }) {
  let uid = parseUidFromJwt(accessToken);
  if (!uid) {
    const profile = await fetchBambuProfile(accessToken, region);
    uid = profile?.uid || profile?.uidStr || profile?.id || null;
  }

  const authRecord = {
    accessToken,
    refreshToken: refreshToken || '',
    uid: uid ? String(uid) : '',
    email: email || '',
    region: region || 'global',
    updatedAt: new Date().toISOString()
  };

  await saveBambuAuth(authRecord);
  const devices = await fetchBambuBindDevices(accessToken, region).catch(() => []);
  return NextResponse.json({
    ok: true,
    email: authRecord.email,
    uid: authRecord.uid,
    devices
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, email, password, code, region = 'global' } = body || {};

    if (action === 'disconnect') {
      await clearBambuAuth();
      return NextResponse.json({ ok: true });
    }

    const baseUrl = getBambuBaseUrl(region);

    if (action === 'token') {
      const rawToken = String(body?.token || '').trim().replace(/^Bearer\s+/i, '');
      if (!rawToken) {
        return NextResponse.json({ error: 'Вставте access token Bambu Lab' }, { status: 400 });
      }
      const profile = await fetchBambuProfile(rawToken, region);
      if (!profile) {
        return NextResponse.json({ error: 'Токен недійсний або прострочений' }, { status: 400 });
      }
      return finalizeBambuLogin({
        accessToken: rawToken,
        refreshToken: '',
        email: profile?.email || profile?.name || 'Google / Apple акаунт',
        region
      });
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Введіть email та пароль Bambu Lab' }, { status: 400 });
      }

      const res = await fetch(`${baseUrl}/v1/user-service/user/login`, {
        method: 'POST',
        headers: getBambuHeaders(),
        body: JSON.stringify({ account: email.trim(), password, apiError: '' })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return NextResponse.json(
          { error: data?.message || data?.error || `Помилка входу Bambu (${res.status})` },
          { status: 400 }
        );
      }

      if (data?.loginType === 'verifyCode' || (!data?.accessToken && data?.loginType)) {
        // Bambu Lab requires an explicit sendemail/code request to dispatch the 6-digit email code
        await fetch(`${baseUrl}/v1/user-service/user/sendemail/code`, {
          method: 'POST',
          headers: getBambuHeaders(),
          body: JSON.stringify({ email: email.trim(), type: 'codeLogin' })
        }).catch(() => {});

        return NextResponse.json({
          ok: true,
          step: 'verify_code',
          email: email.trim(),
          message: 'Bambu Lab надіслав 6-значний код підтвердження на вашу пошту.'
        });
      }

      if (data?.accessToken) {
        return finalizeBambuLogin({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          email: email.trim(),
          region
        });
      }

      return NextResponse.json({ error: 'Не вдалося отримати токен Bambu Lab' }, { status: 400 });
    }

    if (action === 'verify_code') {
      if (!email || !code) {
        return NextResponse.json({ error: 'Введіть код підтвердження з пошти' }, { status: 400 });
      }

      const res = await fetch(`${baseUrl}/v1/user-service/user/login`, {
        method: 'POST',
        headers: getBambuHeaders(),
        body: JSON.stringify({ account: email.trim(), code: String(code).trim() })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.accessToken) {
        return NextResponse.json(
          { error: data?.message || data?.error || 'Невірний або прострочений код підтвердження' },
          { status: 400 }
        );
      }

      return finalizeBambuLogin({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        email: email.trim(),
        region
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Bambu auth route error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
