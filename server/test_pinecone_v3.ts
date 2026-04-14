import dotenv from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';

dotenv.config();

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index('clothing-saas-index');

async function test() {
  console.log("Testing Pinecone Upsert (Records Key Style)...");
  const record = {
    id: 'test-v3-1',
    values: Array(1536).fill(0.123),
    metadata: { name: 'test-v3' }
  };
  
  try {
    // The validator at dist/data/vectors/upsert.js:14 looks for options.records
    // So we pass an object containing records
    // @ts-ignore
    await index.upsert({ records: [record] });
    console.log("✅ Records Key Style Worked!");
  } catch (e) {
    console.error("❌ Records Key Style Failed:", e);
  }
  process.exit(0);
}

test();
