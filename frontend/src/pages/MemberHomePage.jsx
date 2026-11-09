                        onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                        aria-label="Previous month"
                        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:border-[#C5A059] ${isDarkMode ? "border-[#39342B]" : "border-[#E9E4D8]"}`}
                      >
                        ‹
                      </button>
                      <h3 className="min-w-32 text-center text-sm font-bold">{formatMonth(month)}</h3>
                      <button
                        type="button"
                        onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                        aria-label="Next month"
                        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:border-[#C5A059] ${isDarkMode ? "border-[#39342B]" : "border-[#E9E4D8]"}`}
                      >
                        ›
                      </button>
                    </div>
                  </div>
                  <div className={`mb-2 grid grid-cols-7 border-b pb-3 text-center text-xs font-semibold ${mutedText} ${isDarkMode ? "border-[#39342B]" : "border-[#E9E4D8]"}`}>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                      <span key={`${day}-${index}`}>{day}</span>
                    ))}
                  </div>
                  <div className="grid flex-1 auto-rows-fr grid-cols-7 gap-y-2 text-center text-sm">
                    {calendarDays.map((day, index) => (
                      <span
                        key={`${month.getMonth()}-${index}`}
                        className={`mx-auto flex h-10 w-10 items-center justify-center self-center rounded-full transition-all duration-200 ${
                          day === today.getDate() && month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear()
                            ? "bg-[#4A3928] text-white font-bold shadow-xs"
                            : "hover:bg-[#C5A059]/15"
                        }`}
                      >
                        {day || ""}
                      </span>
                    ))}
                  </div>
                  <div className={`mt-6 border-t pt-5 ${isDarkMode ? "border-[#39342B]" : "border-[#E9E4D8]"}`}>
                    <button
                      type="button"
                      onClick={() => onOpenBooking()}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#4A3928] px-4 py-3.5 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#725334] active:scale-95"
                    >
                      <CalendarPlus className="h-4 w-4" /> Book an Appointment
                    </button>
                    <p className={`mt-3 flex items-center justify-center gap-1.5 text-[10px] ${mutedText}`}>
                      <Clock3 className="h-3 w-3" /> Salon hours: 9:00 AM – 6:00 PM
                    </p>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Floating Oval Bottom Navigation Bar (Mobile Only) */}
      <div className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 lg:hidden">
        <nav
          aria-label="Mobile Navigation"
          className="flex items-center justify-around rounded-full border border-white/10 bg-[#4A3928]/95 px-2 py-1.5 text-white shadow-xl backdrop-blur-md transition-all duration-300"
        >
          {[
            {
              id: "home",
              label: "Home",
              icon: Home,
              action: () => navigateMember("home", () => setActiveSection("home")),
            },
            {
              id: "services",
              label: "Services",
              icon: Scissors,
              action: openServices,
            },
            {
              id: "booking",
              label: "Booking",
              icon: CalendarDays,
              action: openBookings,
            }, // <-- Updated
            {
              id: "account",
              label: "Account",
              icon: UserRound,
              action: () => navigateMember("member-account", () => setActiveSection("account")),
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className={`relative flex min-h-11 min-w-[3.5rem] flex-col items-center justify-center rounded-full px-1 text-[10px] transition-all duration-200 active:scale-90 ${
                  isActive
                    ? "text-[#F1E7C6] font-bold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`}
                />
                <span className="mt-0.5 text-[9px]">{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-[#F1E7C6]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <ProfilePictureModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        currentImageUrl={profilePhoto}
        onUpload={saveProfilePhoto}
        onRemove={() => setConfirmPhotoRemoval(true)}
        isDarkMode={isDarkMode}
      />
      <SaveChangesModal
        isOpen={showSaveConfirmation}
        onCancel={() => setShowSaveConfirmation(false)}
        onConfirm={() => {
          setShowSaveConfirmation(false);
          void saveProfile();
        }}