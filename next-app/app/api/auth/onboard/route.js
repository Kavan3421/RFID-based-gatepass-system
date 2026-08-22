import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { hashPassword, signToken } from '@/lib/auth';

function generateOrgCode(prefix = 'ORG') {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const cleanPrefix = prefix.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'QGP';
  return `${cleanPrefix}${randomNum}`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { organizationName, organizationType, destinationType, adminUsername, adminEmail, adminPassword } = body;

    // Admin Email is COMPULSORY for organization registration
    if (!organizationName || !adminUsername || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { success: false, message: 'Organization name, admin username, compulsory admin email, and password are required.' },
        { status: 400 }
      );
    }

    // Generate unique Org Code
    let orgCode = generateOrgCode(organizationName);
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabaseServer
        .from('organizations')
        .select('id')
        .eq('organization_code', orgCode)
        .single();
      if (!existing) break;
      orgCode = generateOrgCode(organizationName);
      attempts++;
    }

    // 1. Create Organization
    const { data: org, error: orgError } = await supabaseServer
      .from('organizations')
      .insert({
        organization_code: orgCode,
        name: organizationName.trim(),
        type: organizationType || 'society',
        destination_type: destinationType || 'flat_wing',
        subscription_status: 'ACTIVE',
      })
      .select()
      .single();

    if (orgError) {
      console.error('Org creation error:', orgError);
      return NextResponse.json(
        { success: false, message: 'Failed to create organization record.' },
        { status: 500 }
      );
    }

    // 2. Hash Password and Create Admin User
    const passwordHash = await hashPassword(adminPassword);
    const { data: adminUser, error: userError } = await supabaseServer
      .from('users')
      .insert({
        organization_id: org.id,
        username: adminUsername.trim(),
        email: adminEmail.trim().toLowerCase(),
        password_hash: passwordHash,
        role: 'ADMIN',
      })
      .select('id, username, email, role')
      .single();

    if (userError) {
      console.error('Admin user creation error:', userError);
      return NextResponse.json(
        { success: false, message: 'Failed to create admin user account.' },
        { status: 500 }
      );
    }

    // 3. Issue Token
    const token = signToken({
      userId: adminUser.id,
      organizationId: org.id,
      organizationCode: org.organization_code,
      role: adminUser.role,
      username: adminUser.username,
    });

    return NextResponse.json({
      success: true,
      message: 'Organization onboarded successfully!',
      organizationCode: org.organization_code,
      token,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        organizationId: org.id,
        organizationCode: org.organization_code,
        organizationName: org.name,
      },
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during organization onboarding.' },
      { status: 500 }
    );
  }
}
