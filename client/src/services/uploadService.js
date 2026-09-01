import api from "./api";

export const uploadFile = async (file) => {
  const formData = new FormData();
  // "file" — bilkul yehi naam. Server par upload.single("file") isi ko dhoondta
  // hai. Naam na milne par multer koi ghalti nahi deta, bas file chup chaap
  // gayab ho jati hai (isi liye wahan `if (!req.file)` ka check lagaya tha).
  formData.append("file", file);

  // Content-Type jaan boojh kar set nahi kar rahe. axios FormData dekh kar khud
  // "multipart/form-data" lagata hai — aur us ke sath ek random "boundary"
  // string bhi jorta hai, jis se server ko pata chalta hai ke ek field kahan
  // khatam hui aur doosri kahan shuru. Haath se header likhne par boundary
  // gayab ho jati hai aur server request parh hi nahi sakta.
  const { data } = await api.post("/upload", formData);
  return data;
};