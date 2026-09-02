# Fashion Rats API 🐀🔥

A gamified backend service for urban fashion enthusiasts. This API manages digital wardrobes, validates daily OOTD (Outfit of the Day) uploads, and enforces strict check-in streaks to maintain user engagement.

Built to demonstrate robust transactional operations, dynamic time-based state machines, and third-party media handling.

**Tech Stack**
* **Framework:** NestJS (TypeScript)
* **Database:** PostgreSQL + Prisma ORM
* **Storage:** AWS S3 (Multipart file handling)
* **Auth:** JWT (Role-Based Access Control)

**Core Business Rules Implemented**
* **Atomic Transactions:** Outfit uploads and wardrobe tagging are processed in a single Prisma `$transaction`. If the DB fails, the S3 upload is rolled back.
* **Temporal State Machines:** CRON Jobs evaluate user local timezones to reset check-in streaks at exactly 00:00.
* **Ownership Validation:** Strict RBAC and resource guarding prevent users from tagging items they do not own.

**Run Locally (The 5 Commands)**

Make sure you have Node.js and Docker installed. Create a `.env` file based on `.env.example`, then run:

1. Install dependencies:
`npm install`

2. Spin up the PostgreSQL database:
`docker compose up -d`

3. Run migrations and generate Prisma Client:
`npx prisma migrate dev`

4. Run the test suite:
`npm run test`

5. Start the development server:
`npm run start:dev`

The API will be available at `http://localhost:3000`.

**Entity Relationship Diagram (ERD)**
* **User:** id, email, current_streak, highest_streak, role
* **WardrobeItem:** id, user_id, brand, category, tags
* **OutfitCheckin:** id, user_id, image_url, created_at
* **_OutfitToItem (N:N):** outfit_id, item_id