import dotenv from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';

dotenv.config();

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index('clothing-saas-index');

async function test() {
  console.log("Testing Pinecone Upsert (Extreme Log)...");
  const records = [
    {
      id: 'test-v2-1',
      values: Array(1536).fill(0.123),
      metadata: { name: 'test-v2' }
    }
  ];
  
  console.log("Records length:", records.length);
  console.log("Is array:", Array.isArray(records));
  
  try {
    const ns = index.namespace('');
    console.log("Namespace object created");
    await ns.upsert(records);
    console.log("✅ Namespace Upsert Worked!");
  } catch (e) {
    console.error("❌ Namespace Upsert Failed:", e);
  }
  process.exit(0);
}

test();
