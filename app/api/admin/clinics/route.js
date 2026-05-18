import { NextResponse } from 'next/server'

export async function GET(request) {
  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    keyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
    keyStart: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20),
  })
}
