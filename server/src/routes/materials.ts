import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { StudyMaterial } from "../models/StudyMaterial.js";

interface UploadRequest extends AuthRequest {
  file?: Express.Multer.File;
}
const router = express.Router();

// Get all materials for current user
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const materials = await StudyMaterial.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select("-originalContent"); // Don't send full content in list

    res.json(materials);
  } catch (error) {
    console.error("Get materials error:", error);
    res.status(500).json({ error: "Помилка отримання матеріалів" });
  }
});

// Get single material
router.get("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!material) {
      return res.status(404).json({ error: "Матеріал не знайдено" });
    }

    res.json(material);
  } catch (error) {
    console.error("Get material error:", error);
    res.status(500).json({ error: "Помилка отримання матеріалу" });
  }
});

// File upload middleware (store in server/uploads)
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (
    req: express.Request,
    file: Express.Multer.File,
    cb: (err: Error | null, destination: string) => void,
  ) {
    cb(null, uploadDir);
  },
  filename: function (
    req: express.Request,
    file: Express.Multer.File,
    cb: (err: Error | null, filename: string) => void,
  ) {
    const unique = Date.now() + "-" + Math.random().toString(36).slice(2, 9);
    cb(null, `${unique}-${file.originalname.replace(/[^a-zA-Z0-9.-_]/g, "_")}`);
  },
});
const upload = multer({ storage });

// Create new material (supports optional file)
router.post(
  "/",
  authMiddleware,
  upload.single("file"),
  async (req: UploadRequest, res) => {
    try {
      let body = req.body || {};
      // If body fields were sent as strings (from form-data), parse JSON fields
      try {
        if (typeof body.glossary === "string")
          body.glossary = JSON.parse(body.glossary);
        if (typeof body.keyFacts === "string")
          body.keyFacts = JSON.parse(body.keyFacts);
        if (typeof body.mindMap === "string")
          body.mindMap = JSON.parse(body.mindMap);
        if (typeof body.flashcards === "string")
          body.flashcards = JSON.parse(body.flashcards);
      } catch (e) {
        // Ignore parse errors
      }

      const materialData: any = { ...body, userId: req.userId };
      if (req.file) {
        materialData.file = {
          originalName: req.file.originalname,
          mime: req.file.mimetype,
          size: req.file.size,
          path: path.relative(process.cwd(), req.file.path),
        };
      }

      const material = new StudyMaterial(materialData);
      await material.save();

      res.status(201).json(material);
    } catch (error) {
      console.error("Create material error:", error);
      res.status(500).json({ error: "Помилка створення матеріалу" });
    }
  },
);

// Update material (e.g., flashcard progress)
router.patch("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!material) {
      return res.status(404).json({ error: "Матеріал не знайдено" });
    }

    // Update fields
    Object.assign(material, req.body);
    await material.save();

    res.json(material);
  } catch (error) {
    console.error("Update material error:", error);
    res.status(500).json({ error: "Помилка оновлення матеріалу" });
  }
});

// Update single flashcard status
router.patch(
  "/:id/flashcards/:cardId",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { status, nextReview } = req.body;

      const material = await StudyMaterial.findOne({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!material) {
        return res.status(404).json({ error: "Матеріал не знайдено" });
      }

      const card = material.flashcards.find((c) => c.id === req.params.cardId);
      if (!card) {
        return res.status(404).json({ error: "Картку не знайдено" });
      }

      card.status = status;
      if (nextReview) card.nextReview = nextReview;

      await material.save();

      res.json(card);
    } catch (error) {
      console.error("Update flashcard error:", error);
      res.status(500).json({ error: "Помилка оновлення картки" });
    }
  },
);

// Delete material
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const material = await StudyMaterial.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!material) {
      return res.status(404).json({ error: "Матеріал не знайдено" });
    }

    // Remove file from disk if available
    try {
      if (material?.file?.path) {
        const fullPath = path.join(process.cwd(), material.file.path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    } catch (e) {
      console.warn("Failed to remove material file:", e);
    }

    res.json({ message: "Матеріал видалено" });
  } catch (error) {
    console.error("Delete material error:", error);
    res.status(500).json({ error: "Помилка видалення матеріалу" });
  }
});

// Download file for a material
router.get("/:id/file", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!material)
      return res.status(404).json({ error: "Матеріал не знайдено" });
    if (!material.file || !material.file.path)
      return res.status(404).json({ error: "Файл не знайдено" });
    const fullPath = path.join(process.cwd(), material.file.path);
    if (!fs.existsSync(fullPath))
      return res.status(404).json({ error: "Файл не знайдено" });
    res.download(fullPath, material.file.originalName);
  } catch (error) {
    console.error("Download file error:", error);
    res.status(500).json({ error: "Помилка завантаження файлу" });
  }
});

export default router;
