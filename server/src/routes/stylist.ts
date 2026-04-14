import { Router } from 'express';
import { processStylistRequest } from '../services/aiStylist.js';

const router = Router();

// POST /api/stylist/chat
router.post('/chat', async (req, res) => {
  try {
    const { userMessage, merchantId } = req.body;

    if (!userMessage) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const result = await processStylistRequest(userMessage, merchantId || '69de48055ba05de6331318ce');
    
    res.json({
      success: true,
      reply: result.reply,
      suggestedProducts: result.products,
      intent: result.intent
    });
  } catch (error: any) {
    console.error('Stylist Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process request',
      message: error.message 
    });
  }
});

export default router;
