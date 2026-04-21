import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import { Campaign } from '../models/Campaign.js';
import { User } from '../models/User.js';

const router = Router();

const campaignSchema = z.object({
  type: z.enum(['restock_alert', 'flash_sale', 'birthday_offer', 'custom']),
  message: z.string().trim().min(5).max(500),
});

// GET /api/campaigns — list all past campaigns
router.get('/', authenticate, authorize(['admin']), async (_req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// POST /api/campaigns — Send a new SMS campaign
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { type, message } = campaignSchema.parse(req.body);

    // Find all users opted in to SMS
    const subscribers = await User.find({ smsOptIn: true, phone: { $exists: true, $ne: '' } });
    const audienceCount = subscribers.length;

    // Send SMS to subscribers
    console.log(`[SMS Campaign] Dispatching '${type}' to ${audienceCount} subscribers.`);
    if (audienceCount > 0) {
      console.log(`[SMS Campaign] Message preview: "${message}"`);
      
      const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
      const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN;
      const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER;

      if (TWILIO_SID && TWILIO_AUTH && TWILIO_FROM) {
        const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH}`).toString('base64');
        const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
        
        // Dispatch asynchronously
        for (const sub of subscribers) {
          if (!sub.phone) continue;
          
          let phone = sub.phone.trim();
          // Ensure it has a leading + for Twilio (e.g., +94 for Sri Lanka if local 0 is omitted)
          if (!phone.startsWith('+')) {
            // Very naive normalization, assuming local format needs + appended or similar based on country
            // You may want to enhance this to ensure proper E.164 format.
            phone = phone.startsWith('0') ? `+94${phone.substring(1)}` : `+${phone}`;
          }

          const bodyParams = new URLSearchParams();
          bodyParams.append('To', phone);
          bodyParams.append('From', TWILIO_FROM);
          bodyParams.append('Body', message);
          
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${auth}`
            },
            body: bodyParams.toString()
          })
          .then(async r => {
            const data = await r.json();
            if (data.error_message) {
              console.error(`❌ Twilio Error sending to ${phone}:`, data.error_message);
            } else {
              console.log(`✅ Twilio success sent to ${phone} (SID: ${data.sid})`);
            }
          })
          .catch(err => {
            console.error(`❌ Twilio network error sending to ${phone}:`, err);
          });
        }
      } else {
        console.warn('⚠️ [SMS Campaign] WARNING: Twilio credentials not found in .env! Physical SMS will NOT be routed.');
      }
    }

    const campaign = new Campaign({
      type,
      message,
      audienceCount,
      status: 'sent',
    });

    await campaign.save();

    res.status(201).json(campaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

export default router;
