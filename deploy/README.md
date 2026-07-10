# Self-hosting lets-care-portugal on Ubuntu (nginx + bun + PM2)

Runs the real Next.js server (`next start`) under Bun, reverse-proxied by nginx,
auto-deployed by a systemd timer that polls `master` every 2 minutes.

**Why polling instead of a webhook/GitHub Actions push:** the box is only
reachable for admin over the university VPN, so we never rely on inbound
connections — the server pulls from GitHub outbound on a timer.

Stack: **nginx** (TLS + reverse proxy) → **PM2** (supervises the app) →
**bun** (`--bun run start`) on `127.0.0.1:3000`.

Assumes user `letscarevpn`, app at `/opt/lets-care-portugal`, domain
`lets-care-portugal.letras.up.pt`.

---

## 0. One-time server prep (as root / sudo)

```bash
# System packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx build-essential unzip curl \
  pkg-config libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
# ^ cairo/pango/... are only needed if pdf-to-img falls back to node-canvas.

# App lives under the existing letscarevpn user
sudo mkdir -p /opt/lets-care-portugal
sudo chown -R letscarevpn:letscarevpn /opt/lets-care-portugal
```

## 1. Runtime toolchain (as `letscarevpn`)

```bash
# You are already logged in as letscarevpn.

# Bun (package manager + runtime)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc          # puts ~/.bun/bin on PATH

# Node + PM2. PM2's daemon runs on Node; the APP still runs on Bun.
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -   # exit deploy shell if sudo unavailable
sudo apt install -y nodejs
npm config set prefix ~/.npm-global
echo 'export PATH=$HOME/.npm-global/bin:$PATH' >> ~/.bashrc && source ~/.bashrc
npm install -g pm2
```

> If `letscarevpn` has no sudo, install Node/PM2 as an admin user, or `bun install -g pm2`
> (PM2 can run under Bun too, but Node is the tested path for the daemon).

## 2. Clone + configure

```bash
# still as letscarevpn
cd /opt
git clone https://github.com/<owner>/lets-care-portugal.git
cd lets-care-portugal

# Production secrets. NEVER commit this; it is gitignored so deploys won't touch it.
cp .env.example .env
nano .env    # fill MongoDB URI, better-auth secret, Resend key, storage, etc.
```

Confirm `.env` is ignored so `git reset --hard` in the deploy script can't wipe it:

```bash
git check-ignore .env    # must print ".env"
```

## 3. First build + start under PM2

```bash
bun install --frozen-lockfile
bun run build
pm2 start deploy/ecosystem.config.cjs
pm2 save

# Restart PM2 (and thus the app) on reboot
pm2 startup systemd -u letscarevpn --hp /home/letscarevpn
# ^ prints a `sudo env ... pm2 startup ...` line — run that line, then:
pm2 save

curl -I http://127.0.0.1:3000     # expect 200 / 307
```

## 4. nginx + TLS (as root)

```bash
sudo cp /opt/lets-care-portugal/deploy/nginx.conf /etc/nginx/sites-available/lets-care
sudo nano /etc/nginx/sites-available/lets-care     # set server_name to your domain
sudo ln -s /etc/nginx/sites-available/lets-care /etc/nginx/sites-enabled/lets-care
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Let's Encrypt (needs the public domain's A record pointing here + 80/443 open)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d lets-care-portugal.letras.up.pt --redirect
# certbot auto-renews via its own systemd timer; verify:
sudo systemctl list-timers | grep certbot
```

## 5. Auto-deploy timer (as root)

```bash
chmod +x /opt/lets-care-portugal/deploy/deploy.sh

sudo cp /opt/lets-care-portugal/deploy/lets-care-deploy.service /etc/systemd/system/
sudo cp /opt/lets-care-portugal/deploy/lets-care-deploy.timer   /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now lets-care-deploy.timer

# Verify
systemctl list-timers lets-care-deploy.timer
sudo systemctl start lets-care-deploy.service   # force one run now
journalctl -u lets-care-deploy.service -n 50 --no-pager
```

Push to `master` → within ~2 min the box fetches, rebuilds, and `pm2 restart`s.

---

## Firewall (if ufw is used)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Day-to-day

| Task | Command |
|------|---------|
| App logs | `pm2 logs lets-care` |
| App status | `pm2 status` |
| Deploy logs | `journalctl -u lets-care-deploy.service -f` |
| Manual deploy | `sudo systemctl start lets-care-deploy.service` |
| Pause auto-deploy | `sudo systemctl stop lets-care-deploy.timer` |
| Restart app | `pm2 restart lets-care` |
| Change poll interval | edit `OnUnitActiveSec` in the `.timer`, then `daemon-reload` |

## Gotchas

- **Bun runtime vs native modules.** The app runs with `bun --bun`. If `sharp`
  (image optimization) or `pdf-to-img` throw at runtime, switch `ecosystem.config.cjs`
  `args` to `run start` (Bun as manager, Node as runtime) — everything else stays.
- **`.env` must stay untracked**, or `git reset --hard` will revert it each deploy.
- **`bun install --frozen-lockfile`** needs `bun.lock` committed. If it errors,
  drop `--frozen-lockfile` in `deploy.sh` once.
- **No zero-downtime.** `pm2 restart` drops in-flight requests for ~1s during the
  swap. For true zero-downtime you'd need cluster mode / two ports — out of scope.
- **Timer, not webhook**, so deploys lag up to 2 min. If you later expose an
  inbound port, a GitHub webhook or self-hosted Actions runner removes the lag.
