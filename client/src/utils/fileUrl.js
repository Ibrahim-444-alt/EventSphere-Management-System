// Image ki value do shakalon mein aa sakti hai, aur dono jaiz hain:
//
//   1. "/uploads/1724567890-482.jpg"      — hamari khud upload ki hui file
//   2. "https://images.unsplash.com/..."  — haath se likha external URL
//
// Pehli ko chalne ke liye server ka origin chahiye; doosri pehle se poori hai.
// Ye helper dono sambhalta hai, taake baaqi code ko farq pata hi na chale.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// api.js ka wohi base le kar "/api" kaat dete hain. Ek nayi env var banane se
// behtar hai — do jagah likhi hui setting ek din alag ho jati hai, aur phir
// tasveerein us jagah dhoondhti hain jahan server nahi hota.
const SERVER_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

export const fileUrl = (value) => {
  if (!value) return "";

  // Pehle se poora URL? Chhoona hi nahi.
  if (/^https?:\/\//i.test(value)) return value;

  // blob: aur data: bhi waise hi jate hain — inhein agle step mein form ka
  // preview istemaal karega (file chunne ke foran baad, upload se pehle).
  if (/^(data|blob):/i.test(value)) return value;

  // Slash ka hisaab: path mein pehle se ho to dobara nahi lagate, warna
  // "http://localhost:5000uploads/x.jpg" ban jata hai.
  return `${SERVER_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
};