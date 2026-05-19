export function checkAdminAuth(request) {
  const cookie = request.cookies.get('ora_admin')
  const secret = process.env.ADMIN_SECRET
  if (!secret || !cookie || cookie.value !== secret) return false
  return true
}
