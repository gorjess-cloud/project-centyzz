import { useEffect, useState } from 'react';

export default function StaffScheduleView({ currentUser }) {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (!currentUser?.accessToken) {
      setAppointments([]);
      return;
    }

    const demoAppointments = [
      {
        id: 1,
        customerName: 'Alice Reyes',
        serviceName: 'Lash Lift',
        appointmentDate: '2026-11-15',
        startTime: '09:00',
        status: 'PENDING',
      },
      {
        id: 2,
        customerName: 'Mia Santos',
        serviceName: 'Hair Cut & Style',
        appointmentDate: '2026-11-16',
        startTime: '13:30',
        status: 'CONFIRMED',
      },
    ];

    setAppointments(demoAppointments);
  }, [currentUser?.accessToken]);

  return (
    <div className="rounded-3xl border border-[#E7DFD4] bg-[#FFFDF8] p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C5A059]">Schedule</p>
          <h2 className="mt-2 text-2xl font-bold text-[#2A1E1B]">Today's appointments</h2>
        </div>
        <span className="rounded-full bg-[#F6F0E6] px-3 py-1 text-xs font-semibold text-[#6F4C2E]">
          {appointments.length} scheduled
        </span>
      </div>

      <div className="space-y-3">
        {appointments.length === 0 ? (
          <p className="text-sm text-[#8A8174]">No appointments scheduled for this staff account yet.</p>
        ) : (
          appointments.map((appointment) => (
            <div key={appointment.id} className="rounded-2xl border border-[#E7DFD4] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#2A1E1B]">{appointment.customerName}</p>
                  <p className="text-sm text-[#8A8174]">{appointment.serviceName}</p>
                </div>
                <span className="rounded-full bg-[#EBDBC8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#6F4C2E]">
                  {appointment.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-[#5F574E]">
                {appointment.appointmentDate} · {appointment.startTime}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}