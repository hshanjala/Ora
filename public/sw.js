self.addEventListener('push', event => {
  const data = event.data?.json() ?? { title: 'Ora', body: '' }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'ora',
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/schedule'))
})
