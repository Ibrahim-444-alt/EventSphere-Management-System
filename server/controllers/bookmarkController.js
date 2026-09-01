const Bookmark = require("../models/Bookmark");
const Session = require("../models/Session");

// @desc    Get the logged-in attendee's saved sessions
// @route   GET /api/bookmarks
// @access  Private/Attendee
const getMyBookmarks = async (req, res) => {
  try {
    // Nested populate: pehle session, phir us session ke andar ka event aur
    // speaker. Ek hi call mein poora card banane ka data mil jata hai, warna
    // page ko har session ke liye alag request bhejni parti.
    const bookmarks = await Bookmark.find({ user: req.user._id }).populate({
      path: "session",
      select: "title description date startTime endTime hall type status event speaker",
      populate: [
        { path: "event", select: "title date status" },
        { path: "speaker", select: "name designation company" },
      ],
    });

    // Admin ne session delete kar diya ho to populate() us bookmark ka session
    // null kar deta hai. Aise bookmark ka koi matlab nahi bacha — yahin saaf
    // kar dete hain, taake page ko null sambhalna hi na pare.
    const dangling = bookmarks.filter((item) => !item.session).map((item) => item._id);
    if (dangling.length > 0) {
      await Bookmark.deleteMany({ _id: { $in: dangling } });
    }

    const live = bookmarks.filter((item) => item.session);

    // Wish list waqt ke hisab se padhi jati hai, save karne ke waqt se nahi.
    // Sort yahan JS mein hai kyunki jis field par sort karna hai wo populate ke
    // baad aati hai — Mongo ki sort() us tak pohanch nahi sakti.
    live.sort((a, b) => {
      const byDate = new Date(a.session.date) - new Date(b.session.date);
      if (byDate !== 0) return byDate;
      return a.session.startTime.localeCompare(b.session.startTime);
    });

    res.json(live);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch saved sessions.", error: error.message });
  }
};

// @desc    Save a session
// @route   POST /api/bookmarks
// @access  Private/Attendee
const addBookmark = async (req, res) => {
  try {
    const { session } = req.body;
    if (!session) return res.status(400).json({ message: "Please choose a session." });

    const sessionDoc = await Session.findById(session);
    if (!sessionDoc) return res.status(404).json({ message: "Session not found." });

    if (sessionDoc.status === "Cancelled") {
      return res.status(400).json({ message: "This session was cancelled, so it can't be saved." });
    }

    // Dobara save karna ghalti nahi — banda jo chahta tha wo pehle se hai. Is
    // liye 400 nahi, 200 ke sath wohi bookmark. Button do bar dab jaye to bhi
    // page par error nahi phatakta.
    const existing = await Bookmark.findOne({ user: req.user._id, session });
    if (existing) return res.json(existing);

    const bookmark = await Bookmark.create({ user: req.user._id, session });
    res.status(201).json(bookmark);
  } catch (error) {
    // Do click theek ek hi waqt par aa gaye: dono ne khaali dekha, dono ne
    // insert kiya, doosre ko unique index ne roka. Wajah wohi hai, jawab wohi.
    if (error.code === 11000) {
      const existing = await Bookmark.findOne({
        user: req.user._id,
        session: req.body.session,
      });
      return res.json(existing);
    }
    if (error.name === "CastError") return res.status(404).json({ message: "Session not found." });
    res.status(500).json({ message: "Failed to save session.", error: error.message });
  }
};

// @desc    Remove a saved session
// @route   DELETE /api/bookmarks/:sessionId
// @access  Private/Attendee
const removeBookmark = async (req, res) => {
  try {
    // Ghaur karein: query mein user bhi shamil hai. Is liye kisi doosre ka
    // bookmark milta hi nahi — malikiyat ka alag 403 check likhne ki zaroorat
    // nahi parti, query khud hi hifazat hai.
    //
    // Raasta session ki id par hai, bookmark ki id par nahi — Schedule page ke
    // paas session ki id hoti hai, bookmark ki nahi.
    const removed = await Bookmark.findOneAndDelete({
      user: req.user._id,
      session: req.params.sessionId,
    });

    if (!removed) {
      return res.status(404).json({ message: "That session isn't in your saved list." });
    }

    res.json({ message: "Removed from saved sessions." });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "That session isn't in your saved list." });
    }
    res.status(500).json({ message: "Failed to remove saved session.", error: error.message });
  }
};

module.exports = {
  getMyBookmarks,
  addBookmark,
  removeBookmark,
};