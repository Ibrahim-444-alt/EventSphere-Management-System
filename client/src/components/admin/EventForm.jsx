import { useState } from "react";
import { uploadFile } from "../../services/uploadService";
import { fileUrl } from "../../utils/fileUrl";
import "./EventForm.css";

const THEME_OPTIONS = ["Technology", "Sustainability", "Food & Beverage", "Healthcare", "Automotive", "Education"];
const STATUS_OPTIONS = ["Draft", "Upcoming", "Ongoing", "Completed", "Cancelled"];

// Ye dono uploadMiddleware.js ki hadd se milte hain. Yahan check karna
// **hifazat nahi, aaraam hai** — banda ko 5MB bhejne aur jawab ka intezaar
// karne ke baad "too large" sunne ki zaroorat nahi, foran pata chal jata hai.
// Asli pehra server par hi hai; ye check browser mein hai aur browser par kabhi
// bharosa nahi kiya jata.
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_MB = 2;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function EventForm({ initialValues, onSubmit, submitLabel, isSubmitting }) {
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    // File input ko foran khaali kar dete hain, kaam shuru karne se **pehle**.
    // Wajah: file input sirf tab change event deta hai jab us ki value badle.
    // Agar upload fail ho aur banda wohi file dobara chune, value wohi rehti
    // hai — koi event nahi, kuch nahi hota, aur lagta hai button toot gaya.
    e.target.value = "";

    if (!file) return;

    setUploadError("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return setUploadError("Please choose a JPG, PNG, WEBP or GIF image.");
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      const sizeMb = (file.size / 1024 / 1024).toFixed(1);
      return setUploadError(`That image is ${sizeMb}MB. Maximum is ${MAX_IMAGE_MB}MB.`);
    }

    setIsUploading(true);
    try {
      const { url } = await uploadFile(file);
      // Server sirf path deta hai ("/uploads/1724...jpg"). Wohi state mein
      // rakhte hain aur wohi database mein jayega — poora URL nahi.
      setForm((prev) => ({ ...prev, image: url }));
    } catch (error) {
      setUploadError(error.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    // Sirf expo se rishta toota, file disk par wahin pari hai. Ye jaan boojh kar
    // hai: is waqt "Remove" dabana matlab sirf form badla, Save abhi hua nahi —
    // file mita dena aur phir banda Cancel kar de, to expo ki asli tasveer
    // hamesha ke liye gayab ho jati. Aise bache hue files ko orphaned files
    // kehte hain, aur un ki safai Phase 9 ka kaam hai.
    setForm((prev) => ({ ...prev, image: "" }));
    setUploadError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Title is required.";
    if (!form.description.trim()) newErrors.description = "Description is required.";
    if (!form.date) newErrors.date = "Date is required.";
    if (!form.startTime) newErrors.startTime = "Start time is required.";
        if (!form.endTime) {
      newErrors.endTime = "End time is required.";
    } else if (
      TIME_PATTERN.test(form.startTime) &&
      TIME_PATTERN.test(form.endTime) &&
      form.endTime <= form.startTime
    ) {
      newErrors.endTime = "End time must be after start time.";
    }
    if (!form.location.trim()) newErrors.location = "Location is required.";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setApiError("");
    try {
      await onSubmit(form);
    } catch (error) {
      setApiError(error.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="event-form">
      {apiError && <div className="event-form-error">{apiError}</div>}

      <div className="event-form-row">
        <label htmlFor="title">Title</label>
        <input id="title" name="title" type="text" value={form.title} onChange={handleChange} className={errors.title ? "has-error" : ""} />
        {errors.title && <p className="field-error">{errors.title}</p>}
      </div>

      <div className="event-form-row">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" rows="4" value={form.description} onChange={handleChange} className={errors.description ? "has-error" : ""} />
        {errors.description && <p className="field-error">{errors.description}</p>}
      </div>

      <div className="event-form-grid">
        <div className="event-form-row">
          <label htmlFor="date">Date</label>
          <input id="date" name="date" type="date" value={form.date} onChange={handleChange} className={errors.date ? "has-error" : ""} />
          {errors.date && <p className="field-error">{errors.date}</p>}
        </div>

        <div className="event-form-row">
          <label htmlFor="registrationDeadline">Registration Deadline</label>
          <input id="registrationDeadline" name="registrationDeadline" type="date" value={form.registrationDeadline} onChange={handleChange} />
        </div>

        <div className="event-form-row">
          <label htmlFor="startTime">Start Time</label>
          <input id="startTime" name="startTime" type="time" value={form.startTime} onChange={handleChange} className={errors.startTime ? "has-error" : ""} />
          {errors.startTime && <p className="field-error">{errors.startTime}</p>}
        </div>

        <div className="event-form-row">
          <label htmlFor="endTime">End Time</label>
          <input id="endTime" name="endTime" type="time" value={form.endTime} onChange={handleChange} className={errors.endTime ? "has-error" : ""} />
          {errors.endTime && <p className="field-error">{errors.endTime}</p>}
        </div>

        <div className="event-form-row">
          <label htmlFor="location">Location</label>
          <input id="location" name="location" type="text" value={form.location} onChange={handleChange} className={errors.location ? "has-error" : ""} />
          {errors.location && <p className="field-error">{errors.location}</p>}
        </div>

        <div className="event-form-row">
          <label htmlFor="theme">Theme</label>
          <select id="theme" name="theme" value={form.theme} onChange={handleChange}>
            <option value="">Select a theme</option>
            {THEME_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        <div className="event-form-row">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={form.status} onChange={handleChange}>
            {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      </div>

      <div className="event-form-row event-image-field">
        {/* Ye <span> hai, <label> nahi — jaan boojh kar. label kisi ek input se
            bandha hota hai, aur is hisse mein do input hain (file aur URL). Ek
            ko chun leta to doosre par click ka amal ghalat jagah jata. */}
        <span className="event-form-label">Event Image (optional)</span>

        <div className="event-image-picker">
          <div className="event-image-preview">
            {form.image ? (
              // Toota URL yahan toota hua hi dikhega, aur ye achi baat hai:
              // banda ko Save karne se pehle hi pata chal jata hai ke link
              // kaam nahi karta. Public page par is ka fallback SVG art hai.
              <img src={fileUrl(form.image)} alt="Event cover preview" />
            ) : (
              <span className="event-image-empty">No image</span>
            )}
          </div>

          <div className="event-image-controls">
            {/* Asli file input chhupa hua hai aur label us ka button ban gaya
                hai. Wajah: browser ka default "Choose File" button har browser
                mein alag dikhta hai aur us ki styling ho hi nahi sakti.
                htmlFor se click kaam karta hai, aur input display:none nahi
                (sirf nazar se ojhal) hai — is liye Tab se focus bhi milta hai. */}
            <input
              id="imageFile"
              type="file"
              accept="image/*"
              className="event-image-input"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <label htmlFor="imageFile" className="admin-btn event-image-btn">
              {isUploading ? "Uploading..." : form.image ? "Replace Image" : "Choose Image"}
            </label>

            {form.image && !isUploading && (
              <button type="button" className="admin-link admin-link-danger" onClick={handleRemoveImage}>
                Remove
              </button>
            )}

            <p className="event-image-hint">JPG, PNG, WEBP or GIF · up to {MAX_IMAGE_MB}MB</p>
          </div>
        </div>

        {uploadError && <p className="field-error">{uploadError}</p>}

        <label htmlFor="image" className="event-image-url-label">Or paste an image URL</label>
        <input id="image" name="image" type="text" value={form.image} onChange={handleChange} placeholder="https://..." />
      </div>

      {/* Save upload ke doran band hai. Warna banda upload chalte hue Save daba
          de aur expo purani (ya khaali) image ke sath mehfooz ho jaye — jabke
          screen par naya button "Uploading..." dikha raha hota. */}
      <button type="submit" className="admin-btn admin-btn-primary" disabled={isSubmitting || isUploading}>
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

export default EventForm;