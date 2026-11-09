import { useEffect, useState } from "react";
const fallback = {
  salonName: "Centyzz Hair & Beauty",
  description: "Hair, nail and beauty services at your local salon.",
  address: "Unit A, Block 15 Lot 2, Bagumbong, Caloocan City",
  phone: "0976 187 2638",
  email: "",
  hours: [],
  timezone: "Asia/Manila",
};
export default function useSalonProfile() {
  const [profile, setProfile] = useState(fallback);
  useEffect(() => {
    let active = true;
    const load = () =>
      fetch("/api/salon/profile")
        .then(async (r) => {
          if (!r.ok) throw Error();
          const data = await r.json();
          if (active) setProfile(data);
        })
        .catch(() => {});
    load();
    window.addEventListener("salon-profile-updated", load);
    window.addEventListener("focus", load);
    return () => {
      active = false;
      window.removeEventListener("salon-profile-updated", load);
      window.removeEventListener("focus", load);
    };
  }, []);
  return profile;
}
