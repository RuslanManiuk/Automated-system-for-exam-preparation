import express from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { ChatHistory } from '../models/ChatHistory.js';

const router = express.Router();

// Get chat history for a material
router.get('/:materialId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let chatHistory = await ChatHistory.findOne({
      userId: req.userId,
      materialId: req.params.materialId
    });

    // Create new chat if doesn't exist
    if (!chatHistory) {
      chatHistory = new ChatHistory({
        userId: req.userId,
        materialId: req.params.materialId,
        messages: []
      });
      await chatHistory.save();
    }

    res.json(chatHistory);
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Помилка отримання історії чату' });
  }
});

// Add message to chat
router.post('/:materialId/messages', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { role, text } = req.body;

    let chatHistory = await ChatHistory.findOne({
      userId: req.userId,
      materialId: req.params.materialId
    });

    if (!chatHistory) {
      chatHistory = new ChatHistory({
        userId: req.userId,
        materialId: req.params.materialId,
        messages: []
      });
    }

    chatHistory.messages.push({
      role,
      text,
      timestamp: new Date()
    });

    await chatHistory.save();

    res.json(chatHistory);
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ error: 'Помилка додавання повідомлення' });
  }
});

// Clear chat history
router.delete('/:materialId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await ChatHistory.findOneAndDelete({
      userId: req.userId,
      materialId: req.params.materialId
    });

    res.json({ message: 'Історію чату очищено' });
  } catch (error) {
    console.error('Clear chat error:', error);
    res.status(500).json({ error: 'Помилка очищення чату' });
  }
});

export default router;
