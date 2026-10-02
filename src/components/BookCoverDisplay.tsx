import React, { useState } from 'react';
import { Camera, BookOpen, Sparkles } from 'lucide-react';
import { Book } from '../types';
import { BookPhotoUploadModal } from './BookPhotoUploadModal';

interface BookCoverDisplayProps {
  book: Book;
  className?: string;
  imageClassName?: string;
  aspectRatio?: string; // e.g. "aspect-[3/4]"
  isAdmin?: boolean;
  onPhotoUpdated?: (updatedBook: Book) => void;
  showAdminBadge?: boolean;
  onNotify?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const BookCoverDisplay: React.FC<BookCoverDisplayProps> = ({
  book,
  className = '',
  imageClassName = '',
  aspectRatio = 'aspect-[3/4]',
  isAdmin = false,
  onPhotoUpdated,
  showAdminBadge = true,
  onNotify
}) => {
  const [imgError, setImgError] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const hasValidImage = Boolean(book.cover_image && !imgError);

  const handleUpdated = (updatedBook: Book) => {
    setImgError(false);
    if (onPhotoUpdated) {
      onPhotoUpdated(updatedBook);
    }
  };

  return (
    <>
      <div className={`relative group overflow-hidden ${aspectRatio} ${className}`}>
        {hasValidImage ? (
          <img
            src={book.cover_image}
            alt={book.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${imageClassName}`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Graceful stylized Christian book cover placeholder */
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white p-4 flex flex-col justify-between border border-slate-800">
            {/* Header / Cross Emblem */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/50 line-clamp-1 max-w-[80%]">
                {book.category || 'Édification'}
              </span>
              <BookOpen className="w-4 h-4 text-sky-400" />
            </div>

            {/* Middle Title & Author */}
            <div className="space-y-1.5 my-auto text-center py-2">
              <div className="w-8 h-8 mx-auto rounded-full bg-sky-500/10 border border-sky-400/30 flex items-center justify-center mb-1">
                <Sparkles className="w-4 h-4 text-sky-400" />
              </div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-white line-clamp-3 leading-snug drop-shadow-sm">
                {book.title}
              </h4>
              <p className="text-[11px] text-sky-200/90 font-medium line-clamp-1">
                {book.author}
              </p>
            </div>

            {/* Footer Notice */}
            <div className="border-t border-slate-800/80 pt-2 text-center">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold block">
                Bibliothèque de Sanctification
              </span>
            </div>
          </div>
        )}

        {/* Admin In-Place Photo Button */}
        {isAdmin && showAdminBadge && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsUploadModalOpen(true);
            }}
            className="absolute top-2 right-2 z-20 px-2.5 py-1.5 rounded-xl bg-slate-950/85 hover:bg-sky-600 text-white text-[11px] font-bold border border-white/20 shadow-lg backdrop-blur-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
            title="Ajouter ou modifier la photo du livre"
          >
            <Camera className="w-3.5 h-3.5 text-sky-300" />
            <span>{hasValidImage ? 'Modifier photo' : '+ Photo'}</span>
          </button>
        )}
      </div>

      {isUploadModalOpen && (
        <BookPhotoUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          book={book}
          onPhotoUpdated={handleUpdated}
          onNotify={onNotify}
        />
      )}
    </>
  );
};
