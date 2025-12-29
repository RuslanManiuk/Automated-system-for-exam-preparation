import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`✅ MongoDB підключено: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Помилка підключення до MongoDB:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB відключено');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Помилка MongoDB:', err);
});
