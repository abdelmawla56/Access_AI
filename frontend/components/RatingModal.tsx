"use client";

import { motion, AnimatePresence } from "framer-motion";

interface RatingModalProps {
  show: boolean;
  ratingVal: number;
  setRatingVal: (star: number) => void;
  ratingComment: string;
  setRatingComment: (text: string) => void;
  ratingSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  speak: (text: string, priority?: "polite" | "assertive") => void;
}

export default function RatingModal({
  show,
  ratingVal,
  setRatingVal,
  ratingComment,
  setRatingComment,
  ratingSubmitting,
  onClose,
  onSubmit,
  speak,
}: RatingModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-md p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-xl glass-card p-10 flex flex-col gap-6 relative border-white/20 text-brand-text"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-xl p-2 rounded-full hover:bg-black/5 cursor-pointer"
            >
              ✕
            </button>
            
            <h2 className="text-3xl font-black border-b border-black/10 pb-3 flex items-center gap-3">
              <span>⭐</span> Rate Symbio Tech
            </h2>
            
            <p className="text-sm font-light text-brand-text/80 leading-relaxed">
              Your rating will be submitted directly to the developers at <strong>s-youssef.elmawla@zewailcity.edu.eg</strong> to help improve system accessibility.
            </p>

            {/* Large WCAG-compliant Star Interactive Grid */}
            <div className="flex justify-center gap-4 py-4" aria-label="Select star rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => {
                    setRatingVal(star);
                    speak(`Set to ${star} stars`, "polite");
                  }}
                  className="text-5xl hover:scale-110 active:scale-95 transition-all outline-none cursor-pointer"
                  aria-label={`Rate ${star} out of 5 stars`}
                >
                  {star <= ratingVal ? "★" : "☆"}
                </button>
              ))}
            </div>
            <p className="text-center font-bold text-lg text-brand-accent">
              {ratingVal} of 5 Stars (Say "rate {ratingVal} stars")
            </p>

            {/* Comments feedback text input */}
            <div className="flex flex-col gap-2">
              <label htmlFor="rating-comment" className="text-xs font-bold uppercase tracking-wider text-brand-subtle">
                Comments / Suggestion
              </label>
              <textarea
                id="rating-comment"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Tell us what we can improve..."
                className="w-full p-4 rounded-xl border border-black/10 bg-white/50 text-sm focus:border-brand-accent outline-none min-h-[80px]"
              />
            </div>

            <div className="flex gap-4 mt-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-full border border-black/10 font-bold hover:bg-black/5 active:scale-95 transition-all text-xs tracking-widest uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={ratingSubmitting}
                className="flex-1 py-3 rounded-full bg-brand-text text-white font-bold hover:opacity-90 active:scale-95 transition-all text-xs tracking-widest uppercase disabled:opacity-50 cursor-pointer"
              >
                {ratingSubmitting ? "Sending..." : "Submit (Say Send)"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
