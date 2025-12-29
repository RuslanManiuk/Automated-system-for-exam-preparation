import React from "react";
import { Github, Mail, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">ExamNinja</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Автоматизована система для підготовки до іспитів з використанням
              AI технологій. Створюй флеш-картки, тести та інтелект-карти за
              лічені хвилини.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">
              Швидкі посилання
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  Про проект
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  Документація
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  Підтримувані формати
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  Політика конфіденційності
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Контакти</h3>
            <div className="space-y-3">
              <a
                href="mailto:support@examninja.com"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4" />
                support@examninja.com
              </a>
              <a
                href="https://github.com/De-Light-n/Automated-system-for-exam-preparation"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              © {currentYear} ExamNinja. Всі права захищені.
            </p>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              Зроблено з <Heart className="w-4 h-4 text-red-500 fill-current" />{" "}
              для студентів
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
