const Registration = require("../models/Registration");
const Settings = require("../models/Settings");
const Event = require("../models/Event");
const sendEmail = require("../utils/sendEmail");
const { registrationConfirmation } = require("../utils/emailTemplates");
// @desc    Get registrations, optionally filtered by event/status, with search
// @route   GET /api/attendees?event=&status=&search=
// @access  Private/Admin
const getAttendees = async (req, res) => {
  try {
    const { event, status, search } = req.query;
    const query = {};
    if (event) query.event = event;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { organization: { $regex: search, $options: "i" } },
      ];
    }

    const attendees = await Registration.find(query)
      .populate("event", "title")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(attendees);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch attendees.", error: error.message });
  }
};

// @desc    Get a single registration by id
// @route   GET /api/attendees/:id
// @access  Private/Admin
const getAttendeeById = async (req, res) => {
  try {
    const attendee = await Registration.findById(req.params.id)
      .populate("event", "title date location")
      .populate("user", "name email");

    if (!attendee) return res.status(404).json({ message: "Registration not found." });
    res.json(attendee);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Registration not found." });
    }
    res.status(500).json({ message: "Failed to fetch registration.", error: error.message });
  }
};

// @desc    Register an attendee for an event (walk-in desk)
// @route   POST /api/attendees
// @access  Private/Admin
const createAttendee = async (req, res) => {
  try {
    const { event, name, email, phone, organization, ticketType } = req.body;

        if (!event || !name || !email) {
      return res.status(400).json({ message: "Event, name and email are required." });
    }

    // Toggle ka check yahan controller mein hai, frontend mein nahi. Chhupa
    // hua button ek visitor ko rok deta hai; wo kisi ko is endpoint ko seedha
    // call karne se nahi rokta — aur "closed" ka matlab closed hona chahiye.
    //
    // 403 na ke 400: request bilkul theek bani hui hai, bas is waqt ijazat
    // nahi hai. 400 ka matlab hota "aapne data ghalat bheja", jo sach nahi.
    const settings = await Settings.getSettings();
    if (!settings.registrationsOpen) {
      return res.status(403).json({
        message: "Registrations are currently closed. An admin can reopen them in Settings.",
      });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    // Both fields go in the query — the same email is allowed on a different
    // event, just not twice on this one.
    const existing = await Registration.findOne({ event, email: trimmedEmail });
    if (existing) {
      return res.status(400).json({
        message: "This email is already registered for this event.",
      });
    }

    const attendee = await Registration.create({
      event,
      name: String(name).trim(),
      email: trimmedEmail,
      phone,
      organization,
      ticketType,
    });

    res.status(201).json(attendee);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "This email is already registered for this event.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to register attendee.", error: error.message });
  }
};

// @desc    Update a registration's details
// @route   PUT /api/attendees/:id
// @access  Private/Admin
const updateAttendee = async (req, res) => {
  try {
    const attendee = await Registration.findById(req.params.id);
    if (!attendee) return res.status(404).json({ message: "Registration not found." });

    // If the email is changing it still has to be unique within this event,
    // excluding this registration itself.
    if (req.body.email !== undefined) {
      const trimmedEmail = String(req.body.email).trim().toLowerCase();

      const clash = await Registration.findOne({
        event: attendee.event,
        email: trimmedEmail,
        _id: { $ne: attendee._id },
      });
      if (clash) {
        return res.status(400).json({
          message: "This email is already registered for this event.",
        });
      }

      req.body.email = trimmedEmail;
    }

    // `event` is off the whitelist — moving a registration to another expo
    // would skip the duplicate check for the new event.
    const editableFields = ["name", "email", "phone", "organization", "ticketType", "status"];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) attendee[field] = req.body[field];
    });

    // "Cancelled but checked in" is nonsense, so cancelling clears the
    // check-in rather than leaving the two fields contradicting each other.
    if (attendee.status === "Cancelled") {
      attendee.checkedIn = false;
      attendee.checkInAt = null;
    }

    const updatedAttendee = await attendee.save();
    res.json(updatedAttendee);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Registration not found." });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        message: "This email is already registered for this event.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to update registration.", error: error.message });
  }
};

// @desc    Check an attendee in or undo a check-in
// @route   PUT /api/attendees/:id/check-in
// @access  Private/Admin
// Body: { checkedIn } — true to check in, false to undo.
const checkInAttendee = async (req, res) => {
  try {
    const attendee = await Registration.findById(req.params.id);
    if (!attendee) return res.status(404).json({ message: "Registration not found." });

    if (attendee.status === "Cancelled") {
      return res.status(400).json({ message: "This registration is cancelled." });
    }

    // Default to checking in, so a bare request from a scanner still works.
    const checkedIn = req.body.checkedIn !== false;

    attendee.checkedIn = checkedIn;
    // The timestamp is set here, on the server, not sent by the client — the
    // arrival time should come from one trusted clock.
    attendee.checkInAt = checkedIn ? new Date() : null;

    const updatedAttendee = await attendee.save();
    res.json(updatedAttendee);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Registration not found." });
    }
    res.status(500).json({ message: "Failed to update check-in.", error: error.message });
  }
};

// @desc    Delete a registration
// @route   DELETE /api/attendees/:id
// @access  Private/Admin
const deleteAttendee = async (req, res) => {
  try {
    const attendee = await Registration.findById(req.params.id);
    if (!attendee) return res.status(404).json({ message: "Registration not found." });

    await attendee.deleteOne();
    res.json({ message: "Registration deleted." });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Registration not found." });
    }
    res.status(500).json({ message: "Failed to delete registration.", error: error.message });
  }
};

// @desc    Register the logged-in attendee for an event
// @route   POST /api/attendees/register
// @access  Private/Attendee
const registerForEvent = async (req, res) => {
  try {
    const { event, phone, organization, ticketType } = req.body;

    if (!event) {
      return res.status(400).json({ message: "Please choose an event." });
    }

    const settings = await Settings.getSettings();
    if (!settings.registrationsOpen) {
      return res.status(403).json({
        message: "Registrations are currently closed. Please check back later.",
      });
    }

    const eventDoc = await Event.findById(event);
    if (!eventDoc) {
      return res.status(404).json({ message: "Event not found." });
    }

    if (!["Upcoming", "Ongoing"].includes(eventDoc.status)) {
      return res.status(400).json({ message: "This event isn't open for registration." });
    }

    // registrationDeadline Event model par pehle din se maujood tha magar ab tak
    // koi ise parhta hi nahi tha. Ghaur karein ke ye rok sirf self-service par
    // hai — admin ka walk-in desk ka maqsad hi ye hai ke darwaze par, deadline
    // guzar jane ke baad bhi banda register ho sake.
    if (eventDoc.registrationDeadline && new Date(eventDoc.registrationDeadline) < new Date()) {
      return res.status(400).json({
        message: "Online registration has closed for this event. You can still register at the venue.",
      });
    }

    // name aur email token se aa rahe hain, req.body se nahi. Warna ek
    // logged-in attendee kisi doosre ke naam par registration bana sakta tha —
    // aur uniqueness ka poora daromadar isi email par hai.
    const email = req.user.email;

        // Dono raaste — nayi registration, aur cancel ke baad wapsi — bilkul ek hi
    // email bhejte hain. Is liye tayyari ek jagah, do baar likhne ki zaroorat
    // nahi. `eventDoc` upar pehle hi fetch ho chuka hai, koi nayi query nahi.
    const mailRegistration = (reg) =>
      sendEmail({
        to: reg.email,
        ...registrationConfirmation({
          name: reg.name,
          eventTitle: eventDoc.title,
          eventDate: eventDoc.date,
          startTime: eventDoc.startTime,
          endTime: eventDoc.endTime,
          location: eventDoc.location,
          ticketType: reg.ticketType,
        }),
      });

    const existing = await Registration.findOne({ event, email });
    if (existing) {
      // Cancel ki hui registration ko dobara zinda kar dete hain. Naya document
      // banane ki koshish event+email waale unique index se takra jati, aur
      // seedha "already registered" keh dena banda ko phansa deta: cancel ke
      // baad wapsi ka koi raasta hi na hota.
      if (existing.status === "Cancelled") {
        existing.status = "Registered";
        existing.user = req.user._id;
        if (phone !== undefined) existing.phone = phone;
        if (organization !== undefined) existing.organization = organization;
        if (ticketType !== undefined) existing.ticketType = ticketType;

        const revived = await existing.save();

        // `await` jaan boojh kar nahi lagaya. SMTP ko jawab dene mein kai second
        // lag sakte hain, aur banda utni der button par "Registering..." dekhta
        // rehta jabke us ka kaam ho chuka hota. sendEmail kabhi throw nahi karta,
        // is liye bina await bhi koi unhandled rejection nahi banti — aur yehi
        // wajah hai ke wahan har cheez try/catch mein lipti hui hai.
        mailRegistration(revived);
        return res.json(revived);
      }

      return res.status(400).json({ message: "You're already registered for this event." });
    }

    const registration = await Registration.create({
      event,
      user: req.user._id,
      name: req.user.name,
      email,
      phone,
      organization,
      ticketType,
    });

    mailRegistration(registration);
    res.status(201).json(registration);
    
    } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You're already registered for this event." });
    }
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Event not found." });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to register.", error: error.message });
  }
};

// @desc    Get the logged-in user's own registrations
// @route   GET /api/attendees/me
// @access  Private
const getMyRegistrations = async (req, res) => {
  try {
    // Do shartein OR se jori hain. `user` un registrations par lagti hai jo
    // banday ne khud banayi; `email` un par jo admin ne walk-in desk se banayi
    // thin (un par user null hota hai). Is tarah darwaze par register hua banda
    // baad mein account banaye to apna ticket portal mein dekh leta hai.
    const registrations = await Registration.find({
      $or: [{ user: req.user._id }, { email: req.user.email }],
    })
      .populate("event", "title date startTime endTime location status")
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your registrations.", error: error.message });
  }
};

// @desc    Cancel your own registration
// @route   PUT /api/attendees/:id/cancel
// @access  Private (the attendee themself, or an admin)
const cancelMyRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: "Registration not found." });

    // Malikana dono taraf se dekha ja raha hai, usi wajah se jo getMyRegistrations
    // mein hai — walk-in registration par user null hota hai.
    const isOwner =
      (registration.user && registration.user.toString() === req.user._id.toString()) ||
      registration.email === req.user.email;

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to cancel this registration." });
    }

    // Check-in ke baad cancel karna tareekh badalna hai. Wo banda hall mein
    // maujood tha — ye record haazri ka saboot hai, sirf ek irada nahi.
    if (registration.checkedIn) {
      return res.status(400).json({
        message: "You've already checked in at the venue, so this can't be cancelled.",
      });
    }

    registration.status = "Cancelled";
    const updated = await registration.save();
    res.json(updated);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Registration not found." });
    }
    res.status(500).json({ message: "Failed to cancel registration.", error: error.message });
  }
};

module.exports = {
  getAttendees,
  getAttendeeById,
  createAttendee,
  updateAttendee,
  checkInAttendee,
  deleteAttendee,
  registerForEvent,
  getMyRegistrations,
  cancelMyRegistration,
};