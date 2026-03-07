# Database Setup Instructions

## Step 1: Create a Neon Database (Free)

1. Go to https://neon.tech
2. Sign up for a free account
3. Create a new project called "betuaa"
4. Copy the connection string (it looks like: `postgresql://user:password@host/database?sslmode=require`)

## Step 2: Add Database URL to .env.local

Add this line to your `.env.local` file:

```bash
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

Replace the URL with your actual Neon connection string from Step 1.

## Step 3: Run Prisma Migrations

After adding the DATABASE_URL, run these commands:

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma db push
```

Note: We use `prisma db push` instead of `migrate dev` for simpler setup.

## Done!

Your database is now set up and ready to use. The app will store:
- ✅ User profiles (wallet, username, email, phone, bio)
- ✅ Trading positions
- ✅ Trade history

All localStorage data will be replaced with database storage.

## Troubleshooting

If you get errors about Prisma schema, make sure your `.env.local` file has the DATABASE_URL set correctly.
