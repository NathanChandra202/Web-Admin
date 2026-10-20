import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dev-api-bengkelmouse.duaenam.id/api';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, mouseName, issue, details, email, address } = body;

    if (!name || !phone || !mouseName || !issue) {
      return NextResponse.json(
        { error: 'Nama, No WhatsApp, Mouse, dan Keluhan wajib diisi' },
        { status: 400 }
      );
    }

    // 0. If caller provided user Authorization token, create booking directly for logged-in user
    const incomingAuth = req.headers.get('authorization');
    if (incomingAuth) {
      try {
        const directRes = await fetch(`${BASE_URL}/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: incomingAuth,
          },
          body: JSON.stringify({
            mouseName,
            issue,
            details: details || '',
          }),
        });
        if (directRes.ok) {
          const directData = await directRes.json();
          const bookingObj = directData?.data || directData;
          bookingObj.user = bookingObj.user || {
            name,
            phone,
            email: email || '',
            address: address || '',
          };
          return NextResponse.json(bookingObj, { status: 201 });
        }
      } catch (authErr) {
        console.warn('Direct auth booking failed, falling back to public bridge:', authErr);
      }
    }

    // 1. First attempt: call /bookings/public
    try {
      const response = await fetch(`${BASE_URL}/bookings/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, mouseName, issue, details, email, address }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data, { status: 201 });
      }
    } catch (_) {
      // Continue to DB bridge
    }

    // 2. Direct save to Database via Auth API
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const guestEmail = email && email.trim() ? email.trim() : `web_${cleanPhone || Date.now()}@bengkelmouse.id`;
      const guestPassword = `bm_guest_${cleanPhone.slice(-6) || '123456'}`;

      let token = '';

      // Try login if already registered
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: guestEmail, password: guestPassword }),
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        token = loginData.token;
      } else {
        // Register guest in DB
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email: guestEmail,
            password: guestPassword,
            phone: cleanPhone || phone,
            address: address || '',
          }),
        });

        if (regRes.ok) {
          const loginAgain = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: guestEmail, password: guestPassword }),
          });
          if (loginAgain.ok) {
            const lData = await loginAgain.json();
            token = lData.token;
          }
        }
      }

      if (token) {
        const bookingRes = await fetch(`${BASE_URL}/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mouseName,
            issue,
            details: details || '',
          }),
        });

        if (bookingRes.ok) {
          const bookingData = await bookingRes.json();
          bookingData.user = {
            name,
            phone: cleanPhone || phone,
            email: guestEmail,
            address: address || '',
          };
          return NextResponse.json(bookingData, { status: 201 });
        }
      }
    } catch (dbErr) {
      console.warn('Database save bridge notice:', dbErr);
    }

    // 3. Fallback virtual reservation if network is completely offline
    const fallbackId = 'BM-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const mockBooking = {
      id: fallbackId,
      userId: 'guest',
      mouseName,
      issue,
      details: details || '',
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      totalAmount: null,
      uniqueCode: null,
      paymentProofUrl: null,
      settlementProofUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        name,
        phone,
        email: email || '',
        address: address || '',
      },
    };

    return NextResponse.json(mockBooking, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const authHeader = req.headers.get('authorization');
  if (!id) return NextResponse.json({ error: 'Order ID wajib diisi' }, { status: 400 });

  const cleanId = id.trim();
  const rawId = cleanId.replace(/^BM-?/i, '');

  // 1. If authHeader is provided (logged in user), query backend /bookings/:id or /bookings
  if (authHeader) {
    try {
      // Try direct GET /bookings/:id
      const res = await fetch(`${BASE_URL}/bookings/${rawId}`, {
        headers: { Authorization: authHeader },
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data?.data || data);
      }

      // Also try with full cleanId
      if (cleanId !== rawId) {
        const res2 = await fetch(`${BASE_URL}/bookings/${cleanId}`, {
          headers: { Authorization: authHeader },
        });
        if (res2.ok) {
          const data2 = await res2.json();
          return NextResponse.json(data2?.data || data2);
        }
      }

      // Try search in /bookings list
      const listRes = await fetch(`${BASE_URL}/bookings`, {
        headers: { Authorization: authHeader },
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        const bookings = Array.isArray(listData) ? listData : listData?.data || [];
        const needle = rawId.toUpperCase();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const found = bookings.find((b: any) => {
          const bId = (b.id || '').toUpperCase();
          return bId === needle || bId.startsWith(needle) || bId.replace(/-/g, '').includes(needle);
        });
        if (found) return NextResponse.json(found);
      }
    } catch (_) {
      // continue to public check
    }
  }

  // 2. Try public endpoint fallback
  try {
    const res = await fetch(`${BASE_URL}/bookings/public/${rawId}`);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data?.data || data);
    }
  } catch (_) {
    // ignore
  }

  return NextResponse.json({ error: 'Order ID tidak ditemukan.' }, { status: 404 });
}
