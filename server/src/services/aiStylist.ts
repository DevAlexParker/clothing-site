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

// Helper: Generate real embeddings using OpenAI
async function getRealEmbedding(text: string) {
  if (!text) {
    // Return a neutral zero-ish vector if no text provided
    return Array.from({ length: 1536 }, () => 0);
  }
  
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (e) {
    console.error("Embedding Error:", e);
    // Fallback to deterministic random if API fails
    const safetyText = text || "";
    return Array.from({ length: 1536 }, (_, i) => Math.sin(safetyText.length + i));
  }
}

export async function processStylistRequest(userMessage: string, merchantId: string) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("Missing LLM API Key");

  // Step 1: Brain Extraction (Structured Output)
  const extractionCompletion = await openai.chat.completions.create({
    model: "openai/gpt-4o-mini",
    messages: [
      { role: "system", content: `You are an expert personal stylist. Analyze the user's request and cleanly extract their constraints into JSON.
      
      CRITICAL: You MUST provide semantic search strings for 'top', 'bottom', and 'shoes'. 
      NEVER provide null or empty strings for these fields. 
      If the user doesn't specify, use your expert fashion sense to suggest the best category.

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

  const usedIds = new Set<string>();

  const findBestItem = async (queryStr: string) => {
     if (!queryStr) return null;
     
     try {
       const res = await index.query({
         vector: await getRealEmbedding(queryStr), 
         topK: 5, // Get more so we can filter duplicates
         includeMetadata: true,
         filter: { merchant_id: { $eq: merchantId } }
       });
       
       // Filter out already used items
       const bestMatch = res.matches.find((m: any) => !usedIds.has(m.id));
       const match = bestMatch || res.matches[0];
       
       if (!match || !match.metadata) return null;
       
       const productId = match.metadata.id || match.id;
       usedIds.add(productId); // Ensure uniqueness

       const fullProduct = await ProductModel.findById(productId).lean();
       if (!fullProduct) return { ...match.metadata, id: productId };
       return { ...fullProduct, id: fullProduct._id.toString() };
     } catch (e) {
       console.error("Pinecone Logic Error:", e);
       return null;
     }
  };


  const topMatch = await findBestItem(intent.queries.top);
  const bottomMatch = await findBestItem(intent.queries.bottom);
  const shoeMatch = await findBestItem(intent.queries.shoes);

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
