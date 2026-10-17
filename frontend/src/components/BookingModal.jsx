import { useState } from 'react';
import { readJsonResponse } from '../api/client.js';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Clock, 
  User, 
  CreditCard,
  ArrowRight,
  Loader2
} from 'lucide-react';

const SERVICES_BY_CATEGORY = {
  Hair: [
    { id: 'h1', name: 'Luxury Hair Extensions', duration: '120 min', price: '₱250' },
    { id: 'h2', name: 'Balayage & Couture Color', duration: '180 min', price: '₱320' },
    { id: 'h3', name: 'Precision Cut & Blow-Dry', duration: '60 min', price: '₱110' },
    { id: 'h4', name: 'Keratin Deep Nourish Treatment', duration: '90 min', price: '₱180' }
  ],
  Nails: [
    { id: 'n1', name: 'Royal Spa Gel Manicure', duration: '60 min', price: '₱85' },
    { id: 'n2', name: 'Sculpted Acrylic Extensions', duration: '90 min', price: '₱130' },
    { id: 'n3', name: 'Luxury Pedicure & Hydration Spa', duration: '75 min', price: '₱105' },
    { id: 'n4', name: 'Japanese Nail Art & Chrome', duration: '90 min', price: '₱140' }
  ],
  Bundle: [
    { id: 'b1', name: 'The VIP Glow Package (Hair & Nails)', duration: '210 min', price: '₱350' },
    { id: 'b2', name: 'Bridal Beauty Suite Experience', duration: '240 min', price: '₱480' },
    { id: 'b3', name: 'Ultimate Weekend Renewal Bundle', duration: '180 min', price: '₱290' }
  ]
};

function BookingModal({ isOpen, onClose, selectedService, isDarkMode }) {
  const [step, setStep] = useState('form');
  const [loadingPayment, setLoadingPayment] = useState(false);
  const initialCategory = selectedService?.category === 'nails'
    ? 'Nails'
    : selectedService?.category === 'bundle'
      ? 'Bundle'
      : 'Hair';
  
  // Date and Calendar Navigation
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedTime, setSelectedTime] = useState('09:00 AM - 10:00 AM');
  
  // Form State
  const [category, setCategory] = useState(initialCategory);
  const [serviceTitle, setServiceTitle] = useState(
    selectedService?.title || SERVICES_BY_CATEGORY[initialCategory][0].name
  );
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [stylist, setStylist] = useState('Karl Maverick Anonuevo (Master Stylist)');

  const handleCategoryChange = (e) => {
    const newCat = e.target.value;
    setCategory(newCat);
    if (SERVICES_BY_CATEGORY[newCat]?.length > 0) {
      setServiceTitle(SERVICES_BY_CATEGORY[newCat][0].name);
    }
  };

  const currentServiceObj = SERVICES_BY_CATEGORY[category]?.find(s => s.name === serviceTitle) || SERVICES_BY_CATEGORY['Hair'][0];
  const totalPriceNumber = parseFloat(currentServiceObj.price.replace(/[^0-9.]/g, '')) || 0;
  const depositAmount = totalPriceNumber * 0.5;
  const balanceRemaining = totalPriceNumber - depositAmount;
  const modalSurface = isDarkMode ? 'bg-[#1A1917] border-[#3A342B]' : 'bg-[#FDFBF7] border-[#E8DFD1]';
  const primaryText = isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]';
  const mutedText = isDarkMode ? 'text-[#C9C1B5]' : 'text-gray-600';
  const fieldStyle = isDarkMode
    ? 'border-[#3A342B] bg-[#242220] text-[#F5F1EA] placeholder-[#A9A39B]'
    : 'border-[#E8DFD1] bg-white text-[#2A1E1B]';
  const insetSurface = isDarkMode ? 'bg-[#242220] border-[#3A342B]' : 'bg-[#F6F0E6] border-[#E8DFD1]';
  const primaryButton = isDarkMode
    ? 'bg-[#3A342B] border border-[#8D7444] text-[#F5F1EA] hover:bg-[#51432D] hover:border-[#C5A059]'
    : 'bg-[#2A1E1B] text-white hover:bg-[#C5A059]';

  if (!isOpen) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();
  const monthName = monthNames[currentMonthIndex];

  const prevMonth = () => {
    const prev = new Date(currentYear, currentMonthIndex - 1, 1);
    if (prev.getFullYear() < today.getFullYear() || (prev.getFullYear() === today.getFullYear() && prev.getMonth() < today.getMonth())) return;
    setCurrentDate(prev);
    setSelectedDay(1);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonthIndex + 1, 1));
    setSelectedDay(1);
  };

  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay();
  const prevMonthDays = new Date(currentYear, currentMonthIndex, 0).getDate();
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => prevMonthDays - firstDayOfWeek + i + 1);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const timeSlots = [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM',
    '03:30 PM - 04:30 PM',
    '05:00 PM - 06:00 PM'
  ];

  // Check if selected date is today
  const isSelectedDateToday = 
    selectedDay === today.getDate() && 
    currentMonthIndex === today.getMonth() && 
    currentYear === today.getFullYear();

  // Helper function to check if a specific time slot has passed today
  const isTimePassed = (timeSlot) => {
    if (!isSelectedDateToday) return false; // If booking for a future day, all times are available

    const startTimeString = timeSlot.split(' - ')[0]; // e.g., "09:00 AM" or "01:00 PM"
    const [time, modifier] = startTimeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const slotTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    
    return slotTime < today;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setStep('confirm');
  };

  const handlePayMongoCheckout = async () => {
    setLoadingPayment(true);
    try {
      const response = await fetch('/api/create-paymongo-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountInPesos: depositAmount,
          serviceName: serviceTitle,
          clientName: fullName,
          clientEmail: email,
          clientPhone: phone
        }),
      });

      const data = await readJsonResponse(response);

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert('Failed to initialize payment with PayMongo. Please try again.');
        setLoadingPayment(false);
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to payment server.');
      setLoadingPayment(false);
    }
  };

  const handleResetAndClose = () => {
    setStep('form');
    onClose();
  };

  const isPastDay = (day) => {
    const checkDate = new Date(currentYear, currentMonthIndex, day);
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return checkDate < todayZero;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className={`${modalSurface} rounded-3xl border shadow-2xl relative transition-all duration-300 w-full overflow-hidden ${
        step === 'form' ? 'max-w-5xl' : 'max-w-md'
      }`}>
        
        {/* Close Button */}
        <button 
          onClick={handleResetAndClose} 
          aria-label="Close modal"
          className={`absolute top-4 right-4 z-10 p-2 ${isDarkMode ? 'text-[#D6D0C8] hover:text-white bg-[#302D29] hover:bg-[#403B34]' : 'text-[#2A1E1B]/60 hover:text-[#2A1E1B] bg-white/80 hover:bg-white'} rounded-full transition-colors shadow-sm`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: Main Form */}
        {step === 'form' && (
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#C5A059] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Book Appointment
              </span>
              <h2 className={`text-2xl sm:text-3xl font-serif font-bold ${primaryText} mt-1`}>Schedule Your Session</h2>
            </div>

            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Calendar Column */}
              <div className={`lg:col-span-5 ${insetSurface} p-5 rounded-2xl border flex flex-col justify-between shadow-inner`}>
                <div>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <button 
                      type="button" 
                      onClick={prevMonth}
                      disabled={currentYear === today.getFullYear() && currentMonthIndex === today.getMonth()}
                      className={`p-1.5 ${isDarkMode ? 'hover:bg-[#39352F] text-[#F5F1EA]' : 'hover:bg-[#E8DFD1] text-[#2A1E1B]'} disabled:opacity-30 rounded-full transition-colors`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <span className={`font-serif font-bold ${primaryText} text-base`}>
                      {monthName} {currentYear}
                    </span>

                    <button 
                      type="button" 
                      onClick={nextMonth}
                      className={`p-1.5 ${isDarkMode ? 'hover:bg-[#39352F] text-[#F5F1EA]' : 'hover:bg-[#E8DFD1] text-[#2A1E1B]'} rounded-full transition-colors`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className={`grid grid-cols-7 text-center text-[11px] font-bold ${isDarkMode ? 'text-[#C9C1B5]' : 'text-[#2A1E1B]/60'} mb-2`}>
                    <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {paddingDays.map((pDay, idx) => (
                      <span key={`pad-${idx}`} className={`py-2 ${isDarkMode ? 'text-[#6F6A63]' : 'text-gray-300'} font-light select-none`}>
                        {pDay}
                      </span>
                    ))}

                    {daysArray.map((day) => {
                      const isSelected = selectedDay === day;
                      const disabled = isPastDay(day);

                      return (
                        <button
                          type="button"
                          key={day}
                          disabled={disabled}
                          onClick={() => setSelectedDay(day)}
                          className={`py-2 rounded-full text-xs font-semibold transition-all ${
                            disabled 
                              ? `${isDarkMode ? 'text-[#6F6A63]' : 'text-gray-300'} cursor-not-allowed line-through` 
                              : isSelected 
                                ? `${isDarkMode ? 'bg-[#3A342B] text-[#E8C77E] ring-1 ring-[#8D7444]' : 'bg-[#2A1E1B] text-[#C5A059]'} shadow-md font-bold scale-105` 
                                : `${isDarkMode ? 'text-[#F5F1EA] hover:bg-[#39352F]' : 'text-[#2A1E1B] hover:bg-[#E8DFD1]/80'} hover:scale-105`
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={`mt-5 pt-3 border-t ${isDarkMode ? 'border-[#3A342B] text-[#D6D0C8]' : 'border-[#E8DFD1] text-[#2A1E1B]/80'} flex items-center justify-between text-xs`}>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-[#C5A059]" />
                    <span>Selected Date:</span>
                  </div>
                  <strong className={`font-serif ${primaryText}`}>
                    {monthName} {selectedDay}, {currentYear}
                  </strong>
                </div>
              </div>

              {/* Time Slots Column */}
              <div className="lg:col-span-3 space-y-3 flex flex-col justify-between">
                <div>
                  <div className={`border-b ${isDarkMode ? 'border-[#3A342B]' : 'border-[#E8DFD1]'} pb-2 mb-3`}>
                    <h3 className={`text-sm font-serif font-bold ${primaryText} flex items-center gap-1.5`}>
                      <Clock className="w-4 h-4 text-[#C5A059]" /> Appointment Time
                    </h3>
                  </div>

                  <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1 custom-scrollbar">
                    {timeSlots.map((slot) => {
                      const isSelected = selectedTime === slot;
                      const disabled = isTimePassed(slot);

                      return (
                        <button
                          type="button"
                          key={slot}
                          disabled={disabled}
                          onClick={() => setSelectedTime(slot)}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs text-center font-medium transition-all ${
                            disabled
                              ? `${isDarkMode ? 'bg-[#302D29] text-[#817B72] border-[#403B34]' : 'bg-gray-100 text-gray-400 border-gray-200'} border cursor-not-allowed line-through`
                              : isSelected
                                ? `${isDarkMode ? 'bg-[#3A342B] text-[#E8C77E] border-[#8D7444]' : 'bg-[#2A1E1B] text-[#C5A059] border-[#C5A059]'} shadow-md font-bold border`
                                : `${isDarkMode ? 'bg-[#242220] text-[#F5F1EA] border-[#3A342B]' : 'bg-white text-[#2A1E1B] border-[#E8DFD1]'} border hover:border-[#C5A059]`
                          }`}
                        >
                          {slot.split(' - ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Client Details Column */}
              <div className="lg:col-span-4 space-y-3">
                <div className={`border-b ${isDarkMode ? 'border-[#3A342B]' : 'border-[#E8DFD1]'} pb-2`}>
                  <h3 className={`text-sm font-serif font-bold ${primaryText}`}>Your Details</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className={`block text-[10px] font-bold ${isDarkMode ? 'text-[#A9A39B]' : 'text-gray-500'} uppercase tracking-wider mb-1`}>
                      Category
                    </label>
                    <select 
                      value={category} 
                      onChange={handleCategoryChange}
                      className={`w-full px-3 py-2.5 rounded-xl border ${fieldStyle} text-xs font-medium focus:outline-none focus:border-[#C5A059]`}
                    >
                      <option value="Hair">Hair Styling & Care</option>
                      <option value="Nails">Nail Artistry & Spa</option>
                      <option value="Bundle">Special Combo Deals</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold ${isDarkMode ? 'text-[#A9A39B]' : 'text-gray-500'} uppercase tracking-wider mb-1`}>
                      Service
                    </label>
                    <select
                      value={serviceTitle}
                      onChange={(e) => setServiceTitle(e.target.value)}
                      required
                      className={`w-full px-3 py-2.5 rounded-xl border ${fieldStyle} text-xs font-medium focus:outline-none focus:border-[#C5A059]`}
                    >
                      {SERVICES_BY_CATEGORY[category]?.map((srv) => (
                        <option key={srv.id} value={srv.name}>
                          {srv.name} ({srv.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold ${isDarkMode ? 'text-[#A9A39B]' : 'text-gray-500'} uppercase tracking-wider mb-1`}>
                      Full Name
                    </label>
                    <div className="relative">
                      <User className={`w-3.5 h-3.5 absolute left-3 top-3 ${isDarkMode ? 'text-[#A9A39B]' : 'text-gray-400'}`} />
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required 
                        placeholder="e.g. Sophia Loren"
                        className={`w-full pl-8 pr-3 py-2 rounded-xl border ${fieldStyle} text-xs focus:outline-none focus:border-[#C5A059]`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold ${isDarkMode ? 'text-[#A9A39B]' : 'text-gray-500'} uppercase tracking-wider mb-1`}>
                      Contact Info
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required 
                        placeholder="Phone No."
                        className={`w-full px-3 py-2 rounded-xl border ${fieldStyle} text-xs focus:outline-none focus:border-[#C5A059]`}
                      />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                        placeholder="Email Address"
                        className={`w-full px-3 py-2 rounded-xl border ${fieldStyle} text-xs focus:outline-none focus:border-[#C5A059]`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold ${isDarkMode ? 'text-[#A9A39B]' : 'text-gray-500'} uppercase tracking-wider mb-1`}>
                      Select Specialist
                    </label>
                    <select 
                      value={stylist}
                      onChange={(e) => setStylist(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border ${fieldStyle} text-xs focus:outline-none focus:border-[#C5A059]`}
                    >
                      <option>Karl Maverick Anonuevo (Master Stylist)</option>
                      <option>Gian Carlo Dela Torre (Senior Hair Stylist)</option>
                      <option>Christian Angelo Javier (Lead Nail Sculptor)</option>
                      <option>Any Available Senior Specialist</option>
                    </select>
                  </div>

                  <button 
                    type="submit" 
                    className={`w-full mt-2 py-3.5 rounded-2xl ${primaryButton} font-serif font-bold text-xs tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2 group`}
                  >
                    <span>Proceed to 50% Deposit</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

            </form>
          </div>
        )}

        {/* STEP 2: Payment Review & Breakdown */}
        {step === 'confirm' && (
          <div className="p-8 text-center space-y-6">
            <div className={`w-14 h-14 ${insetSurface} text-[#C5A059] rounded-full flex items-center justify-center mx-auto border shadow-sm`}>
              <CreditCard className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059]">Deposit Payment</span>
              <h3 className={`text-xl font-serif font-bold ${primaryText}`}>
                50% Partial Payment
              </h3>
              <p className={`text-xs ${mutedText} max-w-xs mx-auto`}>
                A 50% deposit is required to lock in your appointment schedule.
              </p>
            </div>

            <div className={`${insetSurface} p-4 rounded-2xl border text-xs text-left space-y-2`}>
              <div className={`flex justify-between border-b ${isDarkMode ? 'border-[#3A342B]' : 'border-[#E8DFD1]'} pb-2`}>
                <span className={mutedText}>Service:</span>
                <span className={`font-semibold ${primaryText}`}>{serviceTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className={mutedText}>Total Price:</span>
                <span className={`font-semibold ${primaryText}`}>₱{totalPriceNumber.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between text-[#C5A059] font-bold text-sm pt-1 border-t ${isDarkMode ? 'border-[#3A342B]' : 'border-[#E8DFD1]'}`}>
                <span>50% Payable Now:</span>
                <span>₱{depositAmount.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between ${isDarkMode ? 'text-[#A9A39B]' : 'text-gray-500'} text-[11px]`}>
                <span>Remaining Balance at Salon:</span>
                <span>₱{balanceRemaining.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 max-w-xs mx-auto">
              <button 
                onClick={handlePayMongoCheckout}
                disabled={loadingPayment}
                className={`w-full py-3.5 rounded-2xl ${primaryButton} font-serif font-bold text-xs tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2`}
              >
                {loadingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting PayMongo...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₱{depositAmount.toFixed(2)} via PayMongo</span>
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setStep('form')}
                disabled={loadingPayment}
                className={`w-full py-2.5 rounded-2xl border ${isDarkMode ? 'bg-[#242220] border-[#3A342B] hover:bg-[#302D29] text-[#F5F1EA]' : 'bg-white border-[#E8DFD1] hover:bg-[#F6F0E6] text-[#2A1E1B]'} font-medium text-xs transition-colors`}
              >
                Go Back & Edit
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default BookingModal;