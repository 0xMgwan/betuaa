/**
 * Test nTZS transfer API after permissions are enabled
 * Run with: npx tsx scripts/test-ntzs-transfer.ts
 */

const NTZS_API_BASE_URL = 'https://www.ntzs.co.tz';
const NTZS_API_KEY = process.env.NTZS_API_KEY!;

async function testTransfer() {
  console.log('Testing nTZS transfer API...\n');

  // User: 8a7e0b3b-83d3-4080-978c-3016b25ad6b0 (6425 TZS)
  // Platform: fdc370c0-2266-4e0b-9ebf-2fa9b9343ba8 (0 TZS)
  
  const transferData = {
    fromUserId: '8a7e0b3b-83d3-4080-978c-3016b25ad6b0',
    toUserId: 'fdc370c0-2266-4e0b-9ebf-2fa9b9343ba8',
    amountTzs: 10,
  };

  console.log('Transfer request:', transferData);

  const response = await fetch(`${NTZS_API_BASE_URL}/api/v1/transfers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NTZS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transferData),
  });

  const result = await response.json();
  
  console.log('\nResponse status:', response.status);
  console.log('Response body:', JSON.stringify(result, null, 2));

  if (response.ok && result.id) {
    console.log('\n✅ SUCCESS! Transfer API is working!');
    console.log('Transfer ID:', result.id);
    console.log('Status:', result.status);
    console.log('TxHash:', result.txHash || 'pending');
  } else {
    console.log('\n❌ FAILED - API key still lacks transfer permissions');
    console.log('Contact nTZS support to enable transfer permissions');
  }
}

testTransfer().catch(console.error);
