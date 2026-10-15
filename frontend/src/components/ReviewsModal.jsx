import { useMemo, useState } from 'react';
import { X, Star, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { INITIAL_REVIEWS } from '../data/reviewsData';

export default function ReviewsModal({ isOpen, onClose, isDarkMode = false, reviews = INITIAL_REVIEWS }) {
  const [selectedService, setSelectedService] = useState('All Services');
  const [selectedRating, setSelectedRating] = useState('All Ratings');
  const [sortBy, setSortBy] = useState('most-recent');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Filtering & Sorting Logic
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((rev) => {
        const matchesService =
          selectedService === 'All Services' || rev.service === selectedService;
        const matchesRating =
          selectedRating === 'All Ratings' ||
          rev.rating === parseInt(selectedRating, 10);
        return matchesService && matchesRating;
      })
      .sort((a, b) => {
        if (sortBy === 'highest') return b.rating - a.rating;
        if (sortBy === 'lowest') return a.rating - b.rating;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [reviews, selectedService, selectedRating, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage) || 1;
  const currentReviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReviews.slice(start, start + itemsPerPage);
  }, [filteredReviews, currentPage]);

  if (!isOpen) return null;

  const bgModal = isDarkMode ? 'bg-[#1E1B18] text-[#F5F1EA]' : 'bg-[#FAF8F5] text-[#2A1E1B]';
  const cardBg = isDarkMode ? 'bg-[#2A241F] border-[#3E342B]' : 'bg-white border-[#E8DFD1]';
  const inputBg = isDarkMode ? 'bg-[#28221D] border-[#3E342B] text-white' : 'bg-white border-[#E8DFD1] text-gray-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Window Container */}
      <div className={`relative w-full max-w-4xl rounded-3xl p-6 sm:p-10 shadow-2xl border ${isDarkMode ? 'border-[#3E342B]' : 'border-[#E8DFD1]'} ${bgModal} max-h-[90vh] flex flex-col justify-between overflow-y-auto custom-scrollbar`}>
        
        {/* Header Section */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                All Customer Reviews
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                See what our clients are saying about their Centy’zz experience.
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full border border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059]/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters & Sorting Bar */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-[#E8DFD1]/40">
            <div className="flex flex-wrap items-center gap-3">
              {/* Service Filter Dropdown */}
              <div className="relative">
                <select
                  value={selectedService}
                  onChange={(e) => {
                    setSelectedService(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`appearance-none px-4 py-2 pr-8 text-xs rounded-xl border focus:outline-none focus:border-[#C5A059] cursor-pointer ${inputBg}`}
                >
                  <option value="All Services">All Services</option>
                  <option value="Hair Services">Hair Services</option>
                  <option value="Nail Services">Nail Services</option>
                  <option value="Facial Services">Facial Services</option>
                  <option value="Haircut Services">Haircut Services</option>
                  <option value="General Feedback">General Feedback</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Rating Filter Dropdown */}
              <div className="relative">
                <select
                  value={selectedRating}
                  onChange={(e) => {
                    setSelectedRating(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`appearance-none px-4 py-2 pr-8 text-xs rounded-xl border focus:outline-none focus:border-[#C5A059] cursor-pointer ${inputBg}`}
                >
                  <option value="All Ratings">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`appearance-none px-4 py-2 pr-8 text-xs rounded-xl border focus:outline-none focus:border-[#C5A059] cursor-pointer ${inputBg}`}
              >
                <option value="most-recent">Sort: Most Recent</option>
                <option value="highest">Sort: Highest Rating</option>
                <option value="lowest">Sort: Lowest Rating</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-[280px]">
          {currentReviews.length > 0 ? (
            currentReviews.map((rev) => (
              <div
                key={rev.id}
                className={`p-5 rounded-2xl border ${cardBg} shadow-sm flex flex-col justify-between space-y-3 transition-all hover:shadow-md`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#DDC8A2]/40 text-[#C5A059] flex items-center justify-center font-bold text-sm shrink-0">
                      {rev.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold">{rev.name}</h4>
                      <span className="text-[10px] text-gray-400">{rev.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[#C5A059]">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating
                            ? 'fill-[#C5A059] text-[#C5A059]'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                    "{rev.text}"
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <p className="text-xs font-medium">No reviews found matching your selected filters.</p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="pt-4 border-t border-[#E8DFD1]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-[#C5A059] hover:text-[#C5A059] disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-500 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Pagination Dots */}
            <div className="flex items-center gap-1.5">
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`h-2 rounded-full transition-all ${
                    currentPage === idx + 1
                      ? 'w-4 bg-[#C5A059]'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-[#C5A059] hover:text-[#C5A059] disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-500 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-[11px] text-gray-400 font-medium">
            Showing {currentReviews.length} of {filteredReviews.length} reviews
          </span>
        </div>

      </div>
    </div>
  );
}