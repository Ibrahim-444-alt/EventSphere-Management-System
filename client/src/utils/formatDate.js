// Server se date hamesha ISO string ki soorat mein aati hai
// ("2026-09-18T00:00:00.000Z"). Banda use aise nahi parh sakta, is liye
// poori site par yehi ek shakal istemaal karte hain: "18 Sep 2026".
export const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  // Ye guard zaroori hai. `new Date("kachra")` crash nahi karta — chupke se
  // "Invalid Date" ban jata hai, aur toLocaleDateString use lafzon mein page
  // par likh deta hai. Banda samjhta hai app toot gayi. Dash behtar hai.
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Inquiries jaise inbox mein sirf tareekh kaafi nahi. Aaj ke aane wale paanch
// paighaam sab "26 Aug 2026" dikhate hain — kaun pehle aaya, pata hi nahi
// chalta. Yahi dono guard dobara laga rahe hain, warna "Invalid Date" seedha
// page par chhap jata hai.
export const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};