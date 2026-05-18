import { NextResponse } from 'next/server'
import { searchMedicines } from '@/lib/medicines'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''

  if (q.length < 2) {
    return NextResponse.json([])
  }

  const results = searchMedicines(q)
  return NextResponse.json(results.slice(0, 20))
}
