import dotenv from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';

dotenv.config();

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index('clothing-saas-index');

async function test() {
  console.log("Testing Pinecone Upsert...");
  const record = {
    id: 'test-id-1',
    values: Array(1536).fill(0.1),
    metadata: { name: 'test' }
  };
  
  try {
    await index.upsert([record]);
    console.log("✅ Basic Upsert Worked!");
  } catch (e) {
    console.error("❌ Basic Upsert Failed:", e);
  }
  process.exit(0);
}

test();
