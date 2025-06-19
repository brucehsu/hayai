
## Production Deployment

### Environment Setup

1. Set `HOST_URL` to your production domain
2. Generate secure `SESSION_SECRET` (32+ random characters)
3. Configure production OAuth redirect URIs in Google Console
4. Set up AI provider API keys based on your needs

### Deployment Options

- **Deno Deploy**: Native support for Deno Fresh applications
- **Docker**: Use official Deno Docker images
- **VPS**: Direct deployment with systemd service

This repo has been set up to use Fly.io for deployment. The configuration is in the `fly.toml` file. See [Fly.io](https://fly.io) for more information.

### Performance Considerations

- SQLite is suitable for moderate traffic; consider PostgreSQL for high volume
- AI API rate limits vary by provider
- Session data is stored server-side in memory (consider Redis for
  multi-instance)
