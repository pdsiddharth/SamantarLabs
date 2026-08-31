# SamantarLabs — the edge

The marketing site, and the one Caddy that terminates TLS for every product.

## Why this repo exists

Caddy used to live inside LiveQueue's compose stack, and its `deploy/Caddyfile`
described three hostnames: the marketing site, `clinicqueue`, and
`dev-messmate`. That made LiveQueue's repository the thing that decided whether
MessMate was reachable — a routing change for the queue console could take the
mess hall down, and nothing in the file told you so until it happened.

The proxy is a shared resource, so it is owned by the shared repo. Each product
gets one file under `caddy/sites/` and touches nothing else.

## Layout

| Path | What it is |
| --- | --- |
| `caddy/Caddyfile` | Global options, the `hardened` snippet, the marketing site, and `import sites/*.caddy` |
| `caddy/sites/livequeue.caddy` | LiveQueue's routing. Owned by that team. |
| `caddy/sites/messmate.caddy` | MessMate's routing. Owned by that team. |
| `site/index.html` | The marketing page. Bind-mounted, so a `git pull` publishes it. |
| `deploy/reload.sh` | Validate, then reload without dropping connections. |

## How products attach

The proxy and the products meet on an **external** Docker network,
`samantar-edge`. External because a network created by a stack disappears with
`docker compose down` on that stack; this one is owned by nobody and outlives
all of them.

Products publish no host ports. They join `samantar-edge` under a unique alias —
`livequeue-api`, `messmate-api`, `messmate-web` — and this proxy reaches them by
that name. The alias matters: both product stacks have a service called `api`,
and a bare `api` on a shared network resolves to whichever answers first.

## First run

```bash
docker network create samantar-edge
cp .env.example .env   # set ROOT_DOMAIN and ACME_EMAIL
docker compose up -d
```

Then bring each product up with its edge override:

```bash
cd ~/LiveQueue && docker compose -f docker-compose.yml -f deploy/docker-compose.edge.yml up -d
cd ~/MessMate/deploy && docker compose -f docker-compose.prod.yml -f docker-compose.edge.yml up -d --build
```

## Changing routing

Edit your product's file in `caddy/sites/`, then:

```bash
./deploy/reload.sh
```

It validates in a throwaway container before touching the live proxy. Caddy
keeps serving the old config when a reload fails to parse — but a reload you
believe succeeded and did not is worse than an error, so the check is explicit.

## What this does and does not isolate

It isolates **ownership**: nobody edits a file that also describes another
product, and every change is reviewable in one repo.

It does not isolate **failure**. Caddy loads one configuration; a file that does
not parse fails the whole load, and a certificate that will not issue is a
retry loop in the shared log. `reload.sh` catches the first case. Real failure
isolation would mean a proxy per product behind another proxy, which costs more
than it is worth at three hostnames.

## One deployment note

`caddy/` is mounted as a whole directory rather than as individual files. A
single-file bind mount binds an inode; `git pull` replaces a file by renaming a
new one over the old, so a container started before the pull keeps reading the
old inode and `reload.sh` cheerfully re-applies the config you just changed. The
directory mount removes that failure mode — but a container created *before*
this change still has the old mounts, so it needs one `docker compose up -d`
(which recreates it) before reloads behave.
