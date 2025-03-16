/**
 * Lovable deployment configuration
 * This file configures how your application is deployed on Lovable
 */

module.exports = {
  // Build configuration
  build: {
    command: 'npm run build',
    outputDirectory: 'dist',
  },
  
  // Environment variables for production
  env: {
    // Add any environment variables needed for production
    NODE_ENV: 'production',
    VITE_SUPABASE_URL: '{{VITE_SUPABASE_URL}}',
    VITE_SUPABASE_ANON_KEY: '{{VITE_SUPABASE_ANON_KEY}}',
  },
  
  // Routing configuration
  routes: [
    // Serve all static assets from the dist directory
    {
      handle: 'filesystem',
    },
    // For any other route, serve the index.html (for SPA routing)
    {
      src: '.*',
      dest: '/index.html',
    },
  ],
  
  // Headers to add to all responses
  headers: [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin',
        },
        {
          key: 'Cross-Origin-Embedder-Policy',
          value: 'require-corp',
        },
        {
          key: 'Cross-Origin-Resource-Policy',
          value: 'cross-origin',
        },
      ],
    },
  ],
}; 