import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import { Product } from './src/models/Product.js';

dotenv.config();

const openai = new OpenAI({ 
  apiKey: process.env.OPENROUTER_API_KEY, 
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'AURA Platform',
  } 
});
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index('clothing-saas-index');

async function sync() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aura_clothing');
  const products = await Product.find();
  
  console.log(`Syncing ${products.length} products to Pinecone...`);

  const records = [];
  for (const p of products) {
    const text = `${p.name} ${p.category} ${p.price} luxury fashion elite quality`;
    const resp = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text });
    const vector = resp.data[0].embedding;

    records.push({
      id: p._id.toString(),
      values: vector,
      metadata: {
        id: p._id.toString(),
        name: p.name,
        category: p.category,
        merchant_id: p.merchant_id?.toString() || ''
      }
    });
    console.log(`Prepared: ${p.name}`);
  }

  if (records.length > 0) {
    // @ts-ignore
    await index.upsert({ records });
    console.log(`✅ Successfully upserted ${records.length} records to Pinecone.`);
  }
  
  process.exit(0);
}

sync().catch(e => {
  console.error("Sync Failed:", e);
  process.exit(1);
});
