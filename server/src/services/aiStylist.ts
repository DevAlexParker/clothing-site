import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { Product as ProductModel } from '../models/Product.js';


const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'AURA Platform',
  }
});

let pc: Pinecone | null = null;
let index: any = null;

if (process.env.PINECONE_API_KEY) {
  pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  index = pc.index('clothing-saas-index');
}

// 1. Zod Schema for Structured Intent Extraction
const OutfitIntentSchema = z.object({
  occasion: z.string().describe("The occasion or event the outfit is for. e.g. wedding, gym, casual date"),
  budget: z.number().nullable().describe("The maximum budget if the user specifies one, otherwise null"),
  style: z.string().describe("The general aesthetic or vibe. e.g. minimalist, streetwear, formal"),
  fit: z.string().describe("The fit constraint. e.g. loose, oversized, slim. 'regular' if not mentioned."),
  queries: z.object({
    top: z.string().describe("An optimal semantic search query to find the perfect top (shirt/jacket) for this look."),
    bottom: z.string().describe("An optimal semantic search query to find the perfect bottom (pants/shorts) for this look."),
    shoes: z.string().describe("An optimal semantic search query to find the perfect footwear or accessory.")
  })
});

// Helper: Dummy Embedding generator since we don't have an embedding API configured yet
// In production, we'd use OpenAI embeddings endpoint.
function getDummyVector() {
  return Array.from({ length: 1536 }, () => (Math.random() * 2) - 1);
}

export async function processStylistRequest(userMessage: string, merchantId: string) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("Missing LLM API Key");

  // Step 1: Brain Extraction (Structured Output)
  const extractionCompletion = await openai.chat.completions.create({
    model: "openai/gpt-4o-mini",
    messages: [
      { role: "system", content: `You are an expert personal stylist. Analyze the user's request and cleanly extract their constraints into JSON.
      
      Schema:
      {
        "occasion": string,
        "budget": number | null,
        "style": string,
        "fit": string,
        "queries": {
          "top": string,
          "bottom": string,
          "shoes": string
        }
      }` },
      { role: "user", content: userMessage },
    ],
    response_format: { type: 'json_object' }
  });

  const intent = JSON.parse(extractionCompletion.choices[0].message.content || '{}');
  if (!intent.queries) {
    throw new Error("Failed to extract intent");
  }

  console.log("👗 AI Brain Extracted Intent:", intent);

  // Step 2: Multi-Vector Product Search
  if (!index) {
     console.warn("⚠️ Pinecone disconnected. Returning mock results.");
     return { intent, outfit: [], comment: "Pinecone disconnected" };
  }

  const findBestItem = async (queryStr: string) => {
     try {
       const res = await index.query({
         vector: getDummyVector(), 
         topK: 1,
         includeMetadata: true,
         filter: { merchant_id: { $eq: merchantId } }
       });
       
       const match = res.matches[0];
       if (!match || !match.metadata) return null;
       
       // CRITICAL: Fetch full validated product from MongoDB using the ID from Pinecone
       // This prevents frontend crashes due to missing 'images' or 'id'
       const productId = match.metadata.id || match.id;
       const fullProduct = await ProductModel.findById(productId);
       return fullProduct || match.metadata;
     } catch (e) {
       console.error("Pinecone Logic Error:", e);
       return null;
     }
  };


  const [topMatch, bottomMatch, shoeMatch] = await Promise.all([
    findBestItem(intent.queries.top),
    findBestItem(intent.queries.bottom),
    findBestItem(intent.queries.shoes)
  ]);

  const rawOutfitItems: any[] = [topMatch, bottomMatch, shoeMatch].filter(Boolean);

  // Step 3: Synthesis Generation
  const synthesizedCompletion = await openai.chat.completions.create({
    model: "openai/gpt-4o-mini",
    messages: [
      { role: "system", content: "You are AURA's premium stylist. Present the outfit to the user combining the items we found into a cohesive response. Explain WHY this works for their occasion/budget. Use markdown bullet points." },
      { role: "user", content: `User requested: ${userMessage}. \nWe found these items in stock: ${JSON.stringify(rawOutfitItems)}` }
    ]
  });

  const ultimateReply = synthesizedCompletion.choices[0].message.content;

  return {
    intent,
    products: rawOutfitItems,
    reply: ultimateReply
  };
}
