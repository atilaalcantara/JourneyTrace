# Production deployment

The workflow in `.github/workflows/ci-cd.yml` runs tests and a production build for every pull request to `main`. A push to `main` (including a merged pull request) additionally builds an image, publishes it to GitHub Container Registry (GHCR), and deploys it to the production server.

## One-time prerequisites

1. Create a Cloudflare `A` record for `journeytrace.atilaalcantara.com` pointing to the server public IP. Keep it DNS-only while issuing the first Let's Encrypt certificate.
2. Add the GitHub Actions deployment public key to `/home/ubuntu/.ssh/authorized_keys` on the server.
3. Create one repository secret named `DEPLOY_CONFIG`. It contains the server connection and GHCR pull credentials in JSON.

Generate a dedicated deployment key locally; do not reuse a personal SSH key:

```bash
ssh-keygen -t ed25519 -C "github-actions-journeytrace" -f ~/.ssh/journeytrace_github_actions
```

Append `~/.ssh/journeytrace_github_actions.pub` to `/home/ubuntu/.ssh/authorized_keys` on the server. Create a GitHub classic PAT with `read:packages`; it is used only by the server to pull the private GHCR image.

Use the following pinned host entry in the JSON:

```text
|1|lttWIhEGL2zhbzWJPlflWKW9YZk=|L+UJdLAK9OKpb1nU3UZYMJBQMZQ= ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOyLkQWog66Y5uXF5pBwM0Q5WsggzfB8P9KB/Rgx788e
```

Create the JSON locally, replacing the token value, then paste the resulting contents into the `DEPLOY_CONFIG` repository secret:

```bash
jq -n \
  --arg host "193.123.107.169" \
  --arg user "ubuntu" \
  --rawfile ssh_private_key ~/.ssh/journeytrace_github_actions \
  --arg known_hosts '|1|lttWIhEGL2zhbzWJPlflWKW9YZk=|L+UJdLAK9OKpb1nU3UZYMJBQMZQ= ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOyLkQWog66Y5uXF5pBwM0Q5WsggzfB8P9KB/Rgx788e' \
  --arg ghcr_pull_token "PASTE_YOUR_GHCR_READ_PACKAGES_TOKEN" \
  '{host: $host, user: $user, ssh_private_key: $ssh_private_key, known_hosts: $known_hosts, ghcr_pull_token: $ghcr_pull_token}'
```

## Server layout

The app is deployed under `/home/ubuntu/apps/journeytrace` and joins the existing external Docker network `career-vault-net`. The `nginx-proxy` container routes the public hostname to the internal `journeytrace:80` service.

Copy `deploy/nginx/journeytrace-http.conf` to the server and append it to `/home/ubuntu/apps/nginx/default.conf`. Test and reload the proxy before issuing the certificate:

```bash
docker exec nginx-proxy nginx -t
docker exec nginx-proxy nginx -s reload
```

After DNS is live, issue the certificate using the existing webroot mount:

```bash
docker run --rm \
  -v /home/ubuntu/apps/nginx/certs:/etc/letsencrypt \
  -v /home/ubuntu/apps/nginx/html:/var/www/certbot \
  certbot/certbot:latest certonly --webroot -w /var/www/certbot \
  -d journeytrace.atilaalcantara.com
```

Finally, append `deploy/nginx/journeytrace.conf` to `/home/ubuntu/apps/nginx/default.conf`, test with `docker exec nginx-proxy nginx -t`, and reload the proxy with `docker exec nginx-proxy nginx -s reload`.
