import dotenv from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';

dotenv.config();

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index('clothing-saas-index');

async function test() {
  console.log("Testing Pinecone Upsert (Object Style)...");
  const record = {
    id: 'test-id-1',
    values: Array(1536).fill(0.1),
    metadata: { name: 'test' }
  };
  
  try {
    // @ts-ignore
    await index.upsert({ vectors: [record] });
    console.log("✅ Object Style Upsert Worked!");
  } catch (e) {
    console.error("❌ Object Style Upsert Failed:", e);
  }
  process.exit(0);
}

test();
