import { useState } from 'react';
import { Sparkles, Star, ThumbsUp, Target, Send } from 'lucide-react';
import ReviewsModal from '../components/ReviewsModal';
import { INITIAL_REVIEWS } from '../data/reviewsData';

export default function HomePage({ setActivePage, setServiceFilter, onOpenBooking, isDarkMode }) {
  const shell = isDarkMode
    ? 'bg-gradient-to-b from-[#121212] via-[#191715] to-[#241F19] text-[#F5F1EA]'
    : 'bg-[#f4f0ea] text-[#2A1E1B]';
  const sectionShell = isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]';
  const subText = isDarkMode ? 'text-[#D6D0C8]' : 'text-gray-600';
  const cardBg = isDarkMode ? 'bg-[#24201C] border-[#38312B]' : 'bg-white border-[#E8DFD1]';

  // Review form state
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    const newReview = {
      id: Date.now(),
      name: reviewName.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      rating: reviewRating,
      text: reviewText.trim(),
      service: 'General Feedback',
    };
    setReviews((currentReviews) => [newReview, ...currentReviews]);
    setReviewName('');
    setReviewText('');
    setReviewRating(5);
  };

  return (
    <div className={`animate-fadeIn ${shell}`}>
      {/* Hero Section */}
      <section className="relative min-h-[82vh] flex items-center justify-start overflow-hidden py-16 px-6 lg:px-16 border-b border-white/10">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat grayscale-[0.85] contrast-125 brightness-[0.38]"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1920')`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#121110]/90 via-[#121110]/70 to-[#121110]/20" />
        </div>

        <div className="relative z-10 max-w-[720px] space-y-7 pt-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/8 backdrop-blur-[2px] border border-[#D1B06D]/60 text-[#D4AF37] text-[11px] font-semibold uppercase tracking-[0.25em] shadow-[0_0_0_1px_rgba(209,176,109,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            Luxury Beauty Sanctuary
          </div>

          <h1 className="text-[3rem] leading-[0.88] sm:text-[5.5rem] lg:text-[7rem] font-serif font-light text-white">
            Your Beauty,<br />
            <span className="italic font-normal text-[#D4AF37]">Our Passion</span>
          </h1>

          <p className="max-w-[700px] text-[1.05rem] sm:text-[1.15rem] text-[#f0ece8] leading-relaxed font-light">
            Welcome to Centy’zz Hair and Beauty Salon, where expert styling meets personalized care. From fresh cuts to luxurious treatments, we're here to help you look and feel your absolute best. Book your appointment today and let us bring your vision to life.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-5">
            <button 
              onClick={() => onOpenBooking()} 
              className="px-8 py-4 rounded-full bg-[#D1B06D] text-[#1F1A17] font-bold text-[0.72rem] tracking-[0.18em] uppercase shadow-[0_0_0_1px_rgba(209,176,109,0.6)] hover:bg-[#c49d49] transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Book Your Appointment
            </button>
            <button 
              onClick={() => { setActivePage('services'); setServiceFilter('all'); }} 
              className="px-8 py-4 rounded-full border border-[#f2e6d2]/70 text-white text-[0.72rem] font-bold tracking-[0.18em] uppercase hover:bg-white/8 transition-colors"
            >
              Explore Services
            </button>
          </div>
        </div>
      </section>

      {/* Specialty Banners Section */}
      <section className={`py-20 ${sectionShell}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest text-[#503007] font-semibold">SIGNATURE COLLECTIONS</span>
            <h2 className={`text-3xl sm:text-4xl font-serif font-bold mt-2 ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>Our Beauty Services</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div 
              onClick={() => { setActivePage('services'); setServiceFilter('hair'); }} 
              className="cursor-pointer relative h-80 rounded-2xl overflow-hidden group shadow-lg"
            >
              <img 
                src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800" 
                alt="Hair" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-8 flex flex-col justify-end text-white">
                <span className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold">HAIR CARE & TRANSFORMATIONS</span>
                <h3 className="text-2xl font-serif font-bold mt-1">Balayage, Brazilian Rebond, Hair Color</h3>
                <p className={`text-xs mt-1 text-gray-300`}>Tailored color glosses, precision cuts, and deep repair treatments.</p>
              </div>
            </div>

            <div 
              onClick={() => { setActivePage('services'); setServiceFilter('nails'); }} 
              className="cursor-pointer relative h-80 rounded-2xl overflow-hidden group shadow-lg"
            >
              <img 
                src="https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&q=80&w=800" 
                alt="Nails" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-8 flex flex-col justify-end text-white">
                <span className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold">NAIL ARTISTRY & SPA</span>
                <h3 className="text-2xl font-serif font-bold mt-1">Spa Pedicures/Manicures & Gel Nail Art</h3>
                <p className={`text-xs mt-1 text-gray-300`}>Non-toxic long-wear gel polish, foil accents, and cuticle nourishment.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Centy'zz Section */}
      <section className={`py-16 ${sectionShell} border-t border-black/5`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C5A059]">Why choose Centy’zz</p>
          
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Value Cards */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-3`}>
                <div className="w-9 h-9 rounded-full bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <p className={`text-xs leading-relaxed ${subText}`}>
                  To combine artistry, skill, and genuine care to transform hair and nails, making each visit a moment of self-care and rejuvenation.
                </p>
              </div>

              <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm space-y-3`}>
                <div className="w-9 h-9 rounded-full bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5" />
                </div>
                <p className={`text-xs leading-relaxed ${subText}`}>
                  To become the go-to destination for head-to-toe beauty, known for our outstanding service, skilled team, and commitment to making every client feel valued and beautiful.
                </p>
              </div>
            </div>

            {/* Right Headline Block */}
            <div className="lg:col-span-7 lg:pl-8 space-y-4">
              <h2 className={`text-3xl sm:text-5xl font-serif font-light leading-tight ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>
                Expert care for your <br />
                <span className="font-bold italic text-[#C5A059]">Hair</span> and <span className="font-bold italic text-[#C5A059]">Nails.</span>
              </h2>
              <p className={`text-xs sm:text-sm leading-relaxed max-w-xl ${subText}`}>
                Why go to two places when one salon does it all? From precision haircuts and nourishing treatments to flawless manicures and pedicures, we offer a seamless, head-to-toe pampering experience that saves you time without compromising on quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real People. Real Results. Reviews Section */}
      <section className={`py-16 ${sectionShell}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h2 className={`text-2xl sm:text-3xl font-serif font-bold ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>
              Real People. <span className="italic font-normal text-[#C5A059]">Real Results.</span>
            </h2>
            <p className={`text-xs mt-1 ${subText}`}>
              See what our valued clients have to say about their Centy’zz experience. Your journey matters to us.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Reviews Grid (2x2) */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reviews.slice(0, 4).map((rev) => (
                <div key={rev.id} className={`p-5 rounded-2xl border ${cardBg} shadow-sm flex flex-col justify-between space-y-4 min-h-[220px]`}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center font-bold text-sm shrink-0">
                        {rev.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-[#2A1E1B]'}`}>{rev.name}</h4>
                        <span className="text-[10px] text-gray-400">{rev.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[#C5A059]">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#C5A059]" />
                      ))}
                    </div>

                    <p className={`text-xs leading-relaxed ${subText}`}>
                      "{rev.text}"
                    </p>
                  </div>

                  <span className="text-[10px] font-medium text-gray-400 pt-2 border-t border-gray-100/10">
                    {rev.service}
                  </span>
                </div>
              ))}
            </div>

            {/* Share Your Experience Form Block */}
            <div className={`lg:col-span-4 p-6 rounded-3xl border ${cardBg} shadow-md space-y-4`}>
              <div>
                <h3 className={`text-base font-bold font-serif ${isDarkMode ? 'text-white' : 'text-[#2A1E1B]'}`}>
                  Share Your Experience
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  We'd love to hear from you! Leave a review and help others discover the Centy'zz experience.
                </p>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-3 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Your Name *
                  </label>
                  <input 
                    type="text" 
                    required
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="Enter your name" 
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-transparent border border-gray-300/40 focus:border-[#C5A059] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Your Rating *
                  </label>
                  <div className="flex items-center gap-1 text-[#C5A059]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-0.5 transition-transform hover:scale-110"
                      >
                        <Star 
                          className={`w-5 h-5 ${
                            star <= (hoverRating || reviewRating)
                              ? 'fill-[#C5A059] text-[#C5A059]'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Your Review *
                  </label>
                  <textarea 
                    rows={3}
                    required
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Tell us about your experience..." 
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-transparent border border-gray-300/40 focus:border-[#C5A059] focus:outline-none transition-colors resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#C5A059] text-white text-xs font-semibold hover:bg-[#b08d47] transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Review</span>
                </button>
              </form>
            </div>
          </div>

          {/* View More Reviews Button */}
      <div className="text-center pt-4">
        <button 
          onClick={() => setIsReviewsModalOpen(true)} 
          className="text-xs font-semibold text-[#C5A059] hover:underline inline-flex items-center gap-1.5 transition-all"
        >
          <span>View More Reviews</span>
          <span>→</span>
        </button>
      </div>

      {/* Reviews Modal */}
      <ReviewsModal 
        isOpen={isReviewsModalOpen} 
        onClose={() => setIsReviewsModalOpen(false)} 
        isDarkMode={isDarkMode} 
        reviews={reviews}
      />
        </div>
      </section>
    </div>
  );
}