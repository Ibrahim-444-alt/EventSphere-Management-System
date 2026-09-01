// Har role ka apna "ghar". Ye faisla sirf EK jagah likha hai, is liye kal agar
// naya role aaya to sirf yahan ek line barhani paregi — paanch files mein
// dhoondna nahi paregi.
const ROLE_HOME = {
  admin: "/admin",
  exhibitor: "/exhibitor",
  attendee: "/attendee",
};

// Fallback "/" hai (public home), "/dashboard" nahi. Wajah: agar kabhi role
// pehchana na ja sake to banda kisi placeholder page par nahi, asli site par
// utrega — jo har haal mein kaam ki cheez dikhati hai.
export const roleHome = (role) => ROLE_HOME[role] || "/";