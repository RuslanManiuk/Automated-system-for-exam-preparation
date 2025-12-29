import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  "http://localhost:5000/api/auth/google/callback";

export const configurePassport = () => {
  // Serialize user для збереження в сесії
  passport.serializeUser((user: any, done) => {
    done(null, user._id);
  });

  // Deserialize user з сесії
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Перевірка чи користувач вже існує
          let user = await User.findOne({ email: profile.emails?.[0].value });

          if (user) {
            // Якщо користувач існує - оновлюємо його дані
            user.username = profile.displayName || user.username;
            user.avatar = profile.photos?.[0].value;
            await user.save();
          } else {
            // Створюємо нового користувача
            user = new User({
              email: profile.emails?.[0].value,
              username: profile.displayName || "User",
              password: Math.random().toString(36).substring(7), // Випадковий пароль для OAuth користувачів
              avatar: profile.photos?.[0].value,
              stats: {
                xp: 0,
                level: "Студент",
                streak: 0,
                achievements: [],
                cardsLearned: 0,
                testsPassed: 0,
              },
            });
            await user.save();
          }

          done(null, user);
        } catch (error) {
          done(error as Error, undefined);
        }
      }
    )
  );
};
