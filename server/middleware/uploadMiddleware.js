const path = require("path");
const fs = require("fs");
const multer = require("multer");

// uploads folder git mein commit nahi hota, is liye naye computer par (ya clone
// ke baad) mojood hi nahi hota. Server start par bana lete hain — warna pehli
// upload par multer ENOENT de kar girta hai.
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 2;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),

  filename: (req, file, cb) => {
    // Asal filename par bharosa nahi kiya ja sakta, do wajah se:
    //
    // 1) Takraav. Do log "logo.png" bhejein to doosra pehle wale ko chupke se
    //    mita deta hai — aur pehle banda ki tasveer badal jati hai.
    // 2) Hifazat. Naam banda likhta hai, aur us mein "../" jaisa kuch ho sakta
    //    hai jo file ko uploads folder se bahar likhne ki koshish kare.
    //
    // Is liye naam khud banate hain aur asal se sirf extension lete hain.
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Saaf saaf keh deta hoon: ye check `Content-Type` parhta hai jo **browser**
  // batata hai — file ke andar ke bytes nahi. Koi banda kachra.exe ko
  // photo.png bana kar bhej de to ye filter dhoka kha jayega. Asli pehra file
  // ke shuru ke bytes (magic number) parhne se hota hai, jo ek alag package ka
  // kaam hai. Ye filter galti se ghalat file chunne wale ko rokta hai, hamla
  // karne wale ko nahi.
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, WEBP and GIF images are allowed."));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  // Bina limit ke koi ek 500MB ki file bhej kar disk bhar sakta hai.
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

module.exports = { upload, UPLOAD_DIR, MAX_SIZE_MB };