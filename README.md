# Fashion Rats API

API NestJS + Prisma + PostgreSQL. Check-in diário de outfit e streak do usuário, gravados na mesma transação Prisma.

Um check-in por dia (UTC). Se o último foi ontem, o streak sobe. Se houve intervalo, volta a 1. O segundo check-in no mesmo dia responde conflito.

**Stack:** NestJS · TypeScript · PostgreSQL · Prisma

## Modelos

- **User** — id, email, name, current_streak
- **Outfit** — id, userId, note, imageUrl, checkedInAt

## Rodar

Node.js e um PostgreSQL que você já consiga acessar. Este repositório não traz Docker Compose.

Crie um `.env` na raiz:

```
DATABASE_URL=postgresql://usuario:senha@localhost:5432/NOME_DO_BANCO
```

```
npm install
npx prisma migrate dev
npm run test
npm run start:dev
```

A API sobe em `http://localhost:3000` (ou na porta de `PORT`).

Check-in: `POST /outfits/checkin` com `userId` e, se quiser, `note` e `imageUrl`.
