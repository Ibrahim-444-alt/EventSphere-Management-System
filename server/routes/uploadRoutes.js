const express = require("express");
const multer = require("multer");
const { upload, MAX_SIZE_MB } = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Login lazmi hai, magar role ki qaid nahi: admin expo ka cover daalta hai,
// exhibitor apna logo. Bina login khula chhorna matlab koi bhi hamari disk
// bhar sakta hai — aur us par kuch bhi rakh sakta hai.
router.post("/", protect, (req, res) => {
  // Ghaur karein: upload.single() ko middleware ki tarah route par nahi lagaya,
  // haath se chala rahe hain.
  //
  // Wajah: multer ki ghalti (bara file, ghalat qism) ek Error hoti hai. Agar wo
  // Express ke default handler tak pahunche to jawab ek HTML error page banta
  // hai 500 ke sath — aur frontend ka `error.response.data.message` undefined
  // ho jata hai, banda ko sirf "Something went wrong" milta hai. Yahan pakar
  // kar saaf 400 JSON bhejte hain jis mein asal wajah likhi ho.
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: `File is too large. Maximum size is ${MAX_SIZE_MB}MB.`,
        });
      }
      return res.status(400).json({ message: err.message });
    }

    // Sahi field name na ho (jaise "image" ke bajaye "file") to multer ghalti
    // nahi deta — bas req.file khaali reh jata hai. Ye check us khamoshi ko
    // pakarta hai.
    if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded." });
    }

    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

module.exports = router;