const TEAM_MEMBERS = [
  {
    name: "Karl Maverick Anonuevo",
    role: "Senior Hair Stylist  ",
    specialty: "Color Transformations & Extensions",
    experience: "12+ Years",
    image: "https://scontent.fmnl25-8.fna.fbcdn.net/v/t1.6435-9/147264983_232421371889605_5174876634082027303_n.jpg?stp=dst-jpg_tt6&cstp=mx600x600&ctp=s600x600&_nc_cat=108&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeGTjlJ6xGWTmWode10mhjZsvGkBNzSpxbq8aQE3NKnFuhoYIEGKzrQ_UujDoI5i6uImRFkkIvLqjwIKX5-1C0hr&_nc_ohc=6cwbsP1sMBcQ7kNvwG02YSh&_nc_oc=AdqnOzukp8XS8MTLF_dPsBbb9hhUVoIOZ1oz0KnqpyXRYWHW2Ya4TjnkiOFf7GhP2QM&_nc_zt=23&_nc_ht=scontent.fmnl25-8.fna&_nc_gid=-p2p9VVGTEj5DbIXjdUhyw&_nc_ss=7a2a8&oh=00_AQLW7cVGY05KsWgNqq79a9OYdL3K-mvWVddsk3vLquTEWg&oe=6ADBF821"
  },
  {
    name: "Gian Carlo Dela Torre",
    role: "Lead Hair Stylist",
    specialty: "Precision Cuts & Keratin Care",
    experience: "9 Years",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6Ho3GVy6OuhBxUz7z0NSgiFh_OJcvB26aIIS4tSuNQFLEApHYax94bep3&s=10"
  },
  {
    name: "Christian Angelo Javier",
    role: "Cashier & Nail Art Specialist",
    specialty: "3D Art & Gel Sculpting",
    experience: "8 Years",
    image: "https://contents.pep.ph/images2/images2/2024/05/26/diwata-main-1716706486.jpg"
  }
];

export default function AboutPage({ isDarkMode }) {
  return (
    <div className={`min-h-screen py-6 sm:py-10 lg:py-12 animate-fadeIn ${isDarkMode ? 'bg-gradient-to-b from-[#121212] via-[#1B1917] to-[#2A231B] text-[#F5F1EA]' : 'bg-gradient-to-b from-[#FDFBF7] via-[#F1E8D3] to-[#DDC8A2] text-[#2A1E1B]'}`}>
      <div className="mx-auto max-w-7xl space-y-9 px-4 sm:space-y-12 sm:px-6 lg:space-y-16 lg:px-8">
        
        {/* basta Header to */}
        <div className="mx-auto max-w-3xl space-y-3 text-center sm:space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Our Story & Craft</span>
          <h1 className={`text-3xl leading-tight sm:text-5xl font-bold ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>
            Redefining Salon Care with <span className="italic font-normal text-[#C5A059]">Passion & Elegance.</span>
          </h1>
          <p className={`text-sm sm:text-base leading-relaxed ${isDarkMode ? 'text-[#D6D0C8]' : 'text-[#3A2E2B]/80'}`}>
            Founded with a commitment to individual expression and holistic beauty, Centyzz Salon provides an elevated escape where skill meets artistry.
          </p>
        </div>

        {/* Mission & Vision: Sample lang yan */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:gap-8">
          <div className={`space-y-3 rounded-2xl border p-5 sm:rounded-3xl sm:p-8 ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E8DFD1]'}`}>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>Our Mission</h3>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-[#D6D0C8]' : 'text-gray-600'}`}>
              To deliver world-class hair and nail artistry tailored to each client's unique style, while maintaining strict health standards and using eco-conscious luxury products.
            </p>
          </div>
          <div className={`space-y-3 rounded-2xl border p-5 sm:rounded-3xl sm:p-8 ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E8DFD1]'}`}>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>Our Vision</h3>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-[#D6D0C8]' : 'text-gray-600'}`}>
              To remain the leading sanctuary for clients seeking high-end transformations, unmatched hospitality, and innovative aesthetic techniques.
            </p>
          </div>
        </div>

        {/* Team Members */}
        <div className="space-y-5 sm:space-y-8">
          <div className="text-center">
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>Meet Our Master Stylists</h2>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-[#D6D0C8]' : 'text-gray-500'}`}>International experience & dedicated craft.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
            {TEAM_MEMBERS.map((member, i) => (
              <div key={i} className={`space-y-3 overflow-hidden rounded-2xl border p-5 text-center shadow-sm sm:rounded-3xl sm:p-6 ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E8DFD1]'}`}>
                <img src={member.image} alt={member.name} className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-[#C5A059]" />
                <h3 className={`font-bold text-lg ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>{member.name}</h3>
                <p className="text-xs text-[#C5A059] font-medium">{member.role}</p>
                <div className={`text-[11px] space-y-1 ${isDarkMode ? 'text-[#D6D0C8]' : 'text-gray-500'}`}>
                  <p>Specialty: {member.specialty}</p>
                  <p>Experience: {member.experience}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
