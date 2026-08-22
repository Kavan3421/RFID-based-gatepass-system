import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const { organizationCode, username, password } = body;

    if (!organizationCode || !username || !password) {
      return NextResponse.json(
        { success: false, message: 'Organization Code, Username, and Password are required.' },
        { status: 400 }
      );
    }

    // 1. Fetch organization by organization_code
    const { data: org, error: orgError } = await supabaseServer
      .from('organizations')
      .select('id, organization_code, name, subscription_status')
      .eq('organization_code', organizationCode.trim().toUpperCase())
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { success: false, message: 'Invalid Organization ID or credentials.' },
        { status: 401 }
      );
    }

    if (org.subscription_status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'Organization subscription is inactive. Please contact your admin.' },
        { status: 403 }
      );
    }

    // 2. Fetch user within this organization
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('id, organization_id, username, password_hash, role')
      .eq('organization_id', org.id)
      .eq('username', username.trim())
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials or user does not exist in this organization.' },
        { status: 401 }
      );
    }

    // 3. Compare password hash
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    // 4. Generate Session Token
    const token = signToken({
      userId: user.id,
      organizationId: org.id,
      organizationCode: org.organization_code,
      role: user.role,
      username: user.username,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        organizationId: org.id,
        organizationCode: org.organization_code,
        organizationName: org.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}
