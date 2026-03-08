/**
 * One-time script to register the platform wallet as an nTZS user
 * Run with: npx tsx scripts/register-platform-wallet.ts
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { createOrGetUser } from '../lib/ntzs';

const PLATFORM_ADDRESS = '0x63AE20dF13f5C9454666357208c93D369b9670e8';
const PLATFORM_EMAIL = 'platform@betua.app';

async function main() {
  console.log('Registering platform wallet as nTZS user...');
  console.log('Address:', PLATFORM_ADDRESS);
  console.log('Email:', PLATFORM_EMAIL);
  console.log('API Base URL:', process.env.NTZS_API_BASE_URL);

  try {
    const user = await createOrGetUser({
      walletAddress: PLATFORM_ADDRESS,
      email: PLATFORM_EMAIL,
    });

    console.log('\n✅ Platform wallet registered successfully!');
    console.log('User ID:', user.id);
    console.log('Wallet Address:', user.walletAddress);
    console.log('\nThe platform wallet can now receive nTZS transfers.');
  } catch (error) {
    console.error('\n❌ Failed to register platform wallet:', error);
    process.exit(1);
  }
}

main();
