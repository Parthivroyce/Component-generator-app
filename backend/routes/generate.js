const express = require('express');
const axios = require('axios');
const router = express.Router();
const Session = require('../models/Session');
const verifyToken = require('../middleware/authMiddleware'); // ✅ NEW

// ✅ POST /generate — main generation route (protected)
router.post('/', verifyToken, async (req, res) => {
  const { prompt } = req.body;
  const userId = req.user;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o',
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates valid, production-quality React JSX and CSS. Return code inside markdown blocks like ```jsx``` and ```css``` only.',
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const code = response.data.choices[0].message.content;
    const jsxMatch = code.match(/```jsx([\s\S]*?)```/);
    const cssMatch = code.match(/```css([\s\S]*?)```/);

    const jsx = jsxMatch ? jsxMatch[1].trim() : code;
    const css = cssMatch ? cssMatch[1].trim() : '';

    await Session.create({ user: userId, prompt, jsx, css }); // ✅ Save with user

    res.json({ code });
  } catch (err) {
    console.error('❌ AI Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI generation failed' });
  }
});

// ✅ GET /generate/history — return recent sessions for current user only
router.get('/history', verifyToken, async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(sessions);
  } catch (err) {
    console.error('❌ Failed to fetch history:', err.message);
    res.status(500).json({ error: 'Could not fetch history' });
  }
});

// ✅ GET /generate/last — most recent session of this user
router.get('/last', verifyToken, async (req, res) => {
  try {
    const lastSession = await Session.findOne({ user: req.user })
      .sort({ createdAt: -1 });

    if (!lastSession) return res.status(404).json({ error: 'No sessions found' });

    res.json(lastSession);
  } catch (err) {
    console.error('❌ Failed to fetch last session:', err.message);
    res.status(500).json({ error: 'Could not fetch last session' });
  }
});

// ✅ PATCH /generate/update/:id
router.patch('/update/:id', verifyToken, async (req, res) => {
  const { prompt, jsx, css } = req.body;

  try {
    const updated = await Session.findOneAndUpdate(
      { _id: req.params.id, user: req.user }, // ✅ only user's
      { prompt, jsx, css },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Session not found' });

    res.json(updated);
  } catch (err) {
    console.error('❌ Failed to update session:', err.message);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ✅ DELETE /generate/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const result = await Session.findOneAndDelete({ _id: req.params.id, user: req.user });

    if (!result) return res.status(404).json({ success: false, error: 'Not found' });

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Failed to delete session:', err.message);
    res.status(500).json({ success: false, error: 'Delete failed' });
  }
});

module.exports = router;
