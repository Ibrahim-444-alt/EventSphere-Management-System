// Token kahan rakha jaye — poore app mein ye faisla sirf yahan hai. api.js aur
// AuthContext dono isi se poochte hain, is liye storage badalna ek file ka kaam
// hai, poore project mein dhoondne ka nahi.
//
// sessionStorage chuna gaya hai kyunki wo HAR TAB ka apna hota hai. Isi liye
// Tab A admin aur Tab B exhibitor ek sath chal sakte hain — jo is project ke
// liye ahem hai, kyunki teen alag roles dikhana iska asal maqsad hai.
// localStorage poore browser ka ek hi hota hai, aur wahan doosra login pehle
// ko gira deta hai.
//
// Qeemat: tab band karne par us tab ka session khatam ho jata hai. Magar page
// reload se kuch nahi jata — sessionStorage refresh ke baad bhi bacha rehta
// hai, wo sirf tab band hone par mitta hai.

const TOKEN_KEY = "token";

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);

export const setToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);

export const clearToken = () => {
  sessionStorage.removeItem(TOKEN_KEY);

  // Pehle ye app localStorage istemal karti thi. Wahan bacha hua purana token
  // ab kisi kaam ka nahi, magar usay saaf kar dena behtar hai — warna browser
  // mein hamesha ke liye ek istemal-shuda token para rehta hai.
  localStorage.removeItem(TOKEN_KEY);
};