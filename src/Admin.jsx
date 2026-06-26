{
  "rewrites": [
    { "source": "/admin", "destination": "/index.html" },
    { "source": "/admin/(.*)", "destination": "/index.html" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; img-src 'self' data: https://*.supabase.co https://*.supabase.in; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://*.railway.app;"
        }
      ]
    }
  ]
}
