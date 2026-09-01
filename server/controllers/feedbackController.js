const Feedback = require("../models/Feedback");
const Session = require("../models/Session");
const Registration = require("../models/Registration");
const Settings = require("../models/Settings");

const MODERATION_STATUSES = ["Published", "Hidden"];

// @desc    Get all feedback, with optional filters
// @route   GET /api/feedback
// @access  Private/Admin
const getFeedback = async (req, res) => {
  try {
    const { event, session, rating, status, search } = req.query;

    const filter = {};
    if (event) filter.event = event;
    if (session) filter.session = session;
    if (rating) filter.rating = Number(rating);
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { comment: { $regex: search, $options: "i" } },
      ];
    }

    const feedback = await Feedback.find(filter)
      .populate("event", "title")
      .populate("session", "title date startTime")
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch feedback.", error: error.message });
  }
};

// @desc    Get one piece of feedback
// @route   GET /api/feedback/:id
// @access  Private/Admin
const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate("event", "title")
      .populate("session", "title date startTime");

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found." });
    }

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch the feedback.", error: error.message });
  }
};

// @desc    Published feedback for the public site
// @route   GET /api/feedback/public?event=&limit=
// @access  Public
const getPublicFeedback = async (req, res) => {
  try {
    const { event, limit } = req.query;

    // `status` jaan boojh kar query se NAHI parha ja raha. Agar yahan bhi
    // `if (status) filter.status = status` likh dete, to koi bhi banda
    // ?status=Hidden bhej kar wo tamaam raye parh leta jo admin ne chhupai
    // thin — aur chhupane ka poora maqsad khatam ho jata. Ye route sirf ek
    // cheez deta hai, aur wo Published hai.
    const filter = { status: "Published" };
    if (event) filter.event = event;

    // Ye .select() is route ki asli hifazat hai. Feedback ke saath `email` aur
    // `user` bhi mehfooz hote hain — wo yahan se bahar nahi ja sakte. Admin ka
    // route poora document deta hai, ye route sirf itna jitna page par nazar
    // aata hai. Isi liye ye ALAG route hai: ek hi route audience ke hisaab se
    // andaza nahi lagata (wohi soch jo settingsRoutes ke GET /public mein hai).
    const published = await Feedback.find(filter)
      .select("name rating comment category createdAt event")
      .populate("event", "title")
      .sort({ createdAt: -1 });

    const totalCount = published.length;

    // Auslat TAMAAM published raye par nikal rahi hai — un par bhi jin mein
    // sirf sitare hain aur likha kuch nahi. Warna page "4.8" dikhata jo asal
    // mein sirf un do bandon ki auslat hoti jo likhne ke shauqeen thay, aur
    // baaqi pandra ki khamoshi ginti mein hi na aati.
    const averageRating = totalCount
      ? Number((published.reduce((sum, item) => sum + item.rating, 0) / totalCount).toFixed(1))
      : 0;

    // Card sirf usi raye ka banta hai jis mein kuch likha bhi ho. Bina lafzon
    // ka card kuch nahi kehta. Magar ghaur karein: us ke sitare phir bhi ooper
    // auslat mein ginay ja rahe hain — ray zaya nahi hui, sirf card nahi bana.
    const withComments = published.filter((item) => item.comment && item.comment.trim());
    const commentTotal = withComments.length;

    // Number("abc") NaN deta hai, aur NaN ke saath har moqabla false hota hai.
    // Isi liye Number.isInteger pehle lagana zaroori hai — warna ?limit=abc
    // par slice(0, NaN) chal kar khaali list de deta.
    const max = Number(limit);
    const feedback =
      Number.isInteger(max) && max > 0 ? withComments.slice(0, max) : withComments;

    res.json({ averageRating, totalCount, commentTotal, feedback });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid event id." });
    }
    res.status(500).json({ message: "Failed to fetch feedback.", error: error.message });
  }
};

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Public
const createFeedback = async (req, res) => {
  try {
       const { event, session, name, email, rating, comment, category } = req.body;

    if (!event || rating === undefined || rating === null || rating === "") {
      return res.status(400).json({ message: "Event and rating are required." });
    }

    // Naam ka check alag kar diya, kyunke logged-in banday ka naam neeche token
    // se aata hai — us se form ka bheja hua naam maangna bekaar hai.
    if (!req.user && !name) {
      return res.status(400).json({ message: "Name is required." });
    }

    // Ye route sach mein public hai, is liye ye toggle abhi se asli asar
    // rakhta hai — expo khatam hone ke baad admin feedback band kar sakta hai.
    const settings = await Settings.getSettings();
    if (!settings.feedbackOpen) {
      return res.status(403).json({ message: "Feedback submissions are currently closed." });
    }

    // Whole numbers only — a 3.5-star rating would break the star display and
    // the per-rating filter.
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be a whole number from 1 to 5." });
    }

    // If the feedback points at a session, that session must belong to the
    // same event — otherwise a stray id files it under the wrong expo, and
    // the event's averages quietly include feedback that isn't its own.
    if (session) {
      const linkedSession = await Session.findById(session);

      if (!linkedSession) {
        return res.status(404).json({ message: "Session not found." });
      }

      if (linkedSession.event.toString() !== event) {
        return res.status(400).json({ message: "That session belongs to a different event." });
      }
    }
        // Ye do checks sirf logged-in attendee par lagte hain. Kiosk par aaye
    // mehmaan par nahi — us ke paas na account hai na registration ka record,
    // aur us ki raye bhi qeemti hai. Jo saboot mojood ho usi par faisla karte
    // hain; saboot na hone ko jhoot nahi samajhte.
    if (req.user) {
      // Jis expo mein gaye hi nahi, us ki raye se admin ka data kharab hota
      // hai. Email par bhi match karte hain, taake wo banda bhi shamil rahe
      // jise registration desk par walk-in dala gaya tha.
      const attended = await Registration.findOne({
        event,
        status: "Registered",
        $or: [{ user: req.user._id }, { email: req.user.email }],
      });

      if (!attended) {
        return res.status(403).json({
          message: "You can only review an expo you were registered for.",
        });
      }

      // Ek banda ek cheez ki ek hi raye. Ghaur karein ke `session` bhi key ka
      // hissa hai: poore expo ki raye aur kisi ek session ki raye do alag
      // cheezein hain, aur dono dena jaiz hai.
      const already = await Feedback.findOne({
        event,
        session: session || null,
        user: req.user._id,
      });

      if (already) {
        return res.status(400).json({
          message: session
            ? "You've already reviewed that session."
            : "You've already reviewed this expo.",
        });
      }
    }

   const authorName = req.user ? req.user.name : name;
    const authorEmail = req.user ? req.user.email : email || "";

    const feedback = await Feedback.create({
      event,
      session: session || null,
      // Ye bhi verified token se hi aata hai. Kiosk waali ray par null rehta hai.
      user: req.user ? req.user._id : null,
      name: authorName,
      email: authorEmail,
      rating: numericRating,
      comment: comment || "",
      category: category || "Overall",
    });

    res.status(201).json(feedback);
  } 
  catch (error) {
    // Do submit theek ek hi waqt par: dono ne khaali dekha, dono ne insert
    // kiya, doosre ko neeche wala unique index ne roka. Wajah wohi hai jo ooper
    // wale check ki thi, is liye jawab bhi wohi.
    if (error.code === 11000) {
      return res.status(400).json({ message: "You've already reviewed this." });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to submit feedback.", error: error.message });
  }
};

// @desc    Publish or hide feedback
// @route   PUT /api/feedback/:id/status
// @access  Private/Admin
const updateFeedbackStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!MODERATION_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Status must be either Published or Hidden." });
    }

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found." });
    }

    feedback.status = status;
    await feedback.save();

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: "Failed to update the feedback.", error: error.message });
  }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private/Admin
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found." });
    }

    await feedback.deleteOne();

    res.json({ message: "Feedback deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete the feedback.", error: error.message });
  }
};

module.exports = {
  getFeedback,
  getFeedbackById,
  getPublicFeedback,
  createFeedback,
  updateFeedbackStatus,
  deleteFeedback,
};