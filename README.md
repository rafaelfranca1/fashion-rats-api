# Fashion Rats API

Fashion Rats é um hábito gamificado de moda urbana: o look do dia, a sequência que não pode quebrar, e um guarda-roupa digital que ainda vai nascer em cima disso.

Hoje este repo é o backend desse hábito: check-in diário de OOTD e streak em UTC.

## Stack

- NestJS 12 + TypeScript
- PostgreSQL + Prisma 7
- Passport local (email/senha) + JWT Bearer
- bcrypt
- Arquivos em disco local (`StoragePort` / `LocalDiskStorage`)

## Subir

Postgres precisa já estar rodando. Não há Docker Compose neste repo.

1. Copie `.env.example` para `.env` e preencha `DATABASE_URL` e `JWT_SECRET`.
2. `npm install`
3. `npx prisma migrate dev --config ./prisma7.config.ts`  
   Sem `--config` o Prisma 7 tenta `prisma7.config.js` e falha.
4. `npm test`
5. `npm run start:dev`

API: `http://localhost:3000`  
Swagger: `http://localhost:3000/api`

## Variáveis de ambiente

| Variável | Obrigatória | Default |
|---|---|---|
| `DATABASE_URL` | sim | — |
| `JWT_SECRET` | sim (o processo não sobe sem ela) | — |
| `PORT` | não | `3000` |
| `UPLOADS_DIR` | não | `./uploads` |

## Rotas

Público:

- `POST /auth/register` — `{ email, password, name? }` → `{ access_token }`
- `POST /auth/login` — `{ email, password }` → `{ access_token }`
- `GET /health` — processo + `SELECT 1`
- `GET /` — hello
- `GET /api` — Swagger
- `GET /uploads/*` — arquivos estáticos

Bearer (`Authorization: Bearer <token>`):

- `GET /users/me`, `PATCH /users/me`, `DELETE /users/me`
- `GET /outfits/me` — histórico do user do token (`skip`/`take`)
- `POST /outfits/checkin` — `{ note?, imageUrl? }`
- `POST /uploads` — multipart `file` + `prefix` (`outfits` \| `users` \| `wardrobe`)

## Regras que o código cumpre

- Senha nunca é guardada em texto; `passwordHash` não volta no JSON.
- JWT: payload `{ sub, email }`, expiração 7 dias.
- Rotas `/me` e check-in/upload usam o `userId` do token. Não há `:id` de outro user na URL.
- Check-in: streak UTC, um por dia; segundo no mesmo dia UTC → `409`. Create do outfit e update do streak na mesma `$transaction`.
- Upload: jpeg/png/webp, até 5 MB. `ownerId` do form é ignorado; a pasta é o id do token.
- CORS só `http://localhost:3001`.
- `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`).

## Modelo

**User:** `id`, `email` (unique), `name?`, `passwordHash`, `current_streak` (default 0).

**Outfit:** `id`, `userId`, `note?`, `imageUrl?`, `checkedInAt`. Índice `[userId, checkedInAt]`. `onDelete: Cascade` no user.

## Ainda não

wardrobe, S3, CRON, timezone, Docker Compose, deploy, RBAC, `highest_streak`, `role`.
