import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { email, password, agencyName } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 500 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user already exists
    const { data: usersData } = await adminClient.auth.admin.listUsers();
    const existing = usersData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (existing) {
      // Auto confirm the existing user and update password/metadata
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(existing.id, {
        email_confirm: true,
        password,
        user_metadata: { agency_name: agencyName || "Independent Studio" },
      });

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "User auto-confirmed" });
    }

    // Create user with email_confirm: true so no email is sent and no rate limit is triggered
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        agency_name: agencyName || "Independent Studio",
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
