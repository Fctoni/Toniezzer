// Service Worker para PWA - Toniezzer Manager
// Versão é atualizada a cada deploy para forçar atualização
const CACHE_VERSION = 'v1';
const CACHE_NAME = `toniezzer-${CACHE_VERSION}`;

// Arquivos para cache inicial (offline básico)
const STATIC_ASSETS = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Instalar o service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => {
        // IMPORTANTE: Ativa imediatamente sem esperar tabs fecharem
        self.skipWaiting();
      })
  );
});

// Ativar o service worker e limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('toniezzer-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // IMPORTANTE: Assume controle de todas as páginas imediatamente
      return self.clients.claim();
    })
  );
});

// Interceptar requisições - Network First com fallback para cache
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET e requisições para APIs externas
  if (event.request.method !== 'GET') return;
  
  // Ignorar requisições para o Supabase e outras APIs
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  
  // Ignorar requisições de API e autenticação
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

  event.respondWith(
    // Estratégia: Network First - sempre busca do servidor primeiro
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, salva no cache
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se falhar (offline), tenta o cache
        return caches.match(event.request);
      })
  );
});

// Listener para mensagens - permite forçar atualização
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
