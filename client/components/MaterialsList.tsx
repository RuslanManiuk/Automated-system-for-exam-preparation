import React, { useEffect, useState } from "react";
import {
  FileText,
  Clock,
  ChevronRight,
  Trash2,
  Download,
  FolderOpen,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api } from "../services/apiClient";

interface MaterialItem {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  file?: {
    originalName?: string;
    mime?: string;
    size?: number;
  };
}

interface MaterialsListProps {
  currentMaterialId?: string;
  onSelectMaterial: (material: any) => void;
  onBack?: () => void;
}

export const MaterialsList: React.FC<MaterialsListProps> = ({
  currentMaterialId,
  onSelectMaterial,
  onBack,
}) => {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMaterials();
      setMaterials(data);
    } catch (err) {
      console.error("Error loading materials:", err);
      setError("Не вдалося завантажити матеріали");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMaterial = async (materialId: string) => {
    try {
      const fullMaterial = await api.getMaterial(materialId);
      onSelectMaterial({
        ...fullMaterial,
        id: fullMaterial._id,
        createdAt: new Date(fullMaterial.createdAt).getTime(),
      });
    } catch (err) {
      console.error("Error loading material:", err);
      setError("Не вдалося завантажити матеріал");
    }
  };

  const handleDelete = async (materialId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Ви впевнені, що хочете видалити цей матеріал?")) return;

    try {
      setDeletingId(materialId);
      await api.deleteMaterial(materialId);
      setMaterials((prev) => prev.filter((m) => m._id !== materialId));
    } catch (err) {
      console.error("Error deleting material:", err);
      setError("Не вдалося видалити матеріал");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (
    materialId: string,
    fileName: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    try {
      const blob = await api.downloadMaterialFile(materialId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "material-file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading file:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-in fade-in duration-500">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400">
          Завантаження матеріалів...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-in fade-in duration-500">
        <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={loadMaterials}
          className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
        >
          Спробувати ще раз
        </button>
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-in fade-in duration-500">
        <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full mb-6">
          <FolderOpen className="w-12 h-12 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          Немає збережених матеріалів
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-6">
          Завантажте свій перший файл, щоб почати навчання. Всі ваші матеріали
          будуть збережені тут.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Завантажити файл
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
            Мої матеріали
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {materials.length}{" "}
            {materials.length === 1
              ? "матеріал"
              : materials.length < 5
              ? "матеріали"
              : "матеріалів"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {materials.map((material) => {
          const isActive = material._id === currentMaterialId;
          return (
            <div
              key={material._id}
              onClick={() => handleSelectMaterial(material._id)}
              className={`
                group relative bg-white dark:bg-slate-800 rounded-2xl p-5 cursor-pointer
                border-2 transition-all duration-200 hover:shadow-lg
                ${
                  isActive
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
                }
              `}
            >
              {isActive && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-primary text-white text-xs font-bold rounded-lg">
                  Активний
                </div>
              )}

              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`
                  p-3 rounded-xl
                  ${
                    isActive
                      ? "bg-primary/10 dark:bg-primary/20"
                      : "bg-slate-100 dark:bg-slate-700"
                  }
                `}
                >
                  <FileText
                    className={`w-6 h-6 ${
                      isActive
                        ? "text-primary"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 dark:text-white truncate pr-16 group-hover:text-primary transition-colors">
                    {material.title}
                  </h3>
                  {material.file?.originalName && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">
                      {material.file.originalName}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDate(material.createdAt)}</span>
                </div>
                {material.file?.size && (
                  <span>{formatFileSize(material.file.size)}</span>
                )}
              </div>

              <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {material.file && (
                  <button
                    onClick={(e) =>
                      handleDownload(
                        material._id,
                        material.file?.originalName || "file",
                        e,
                      )
                    }
                    className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    title="Завантажити оригінал"
                  >
                    <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>
                )}
                <button
                  onClick={(e) => handleDelete(material._id, e)}
                  disabled={deletingId === material._id}
                  className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                  title="Видалити"
                >
                  {deletingId === material._id ? (
                    <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-red-500" />
                  )}
                </button>
              </div>

              <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
