// Email ka HTML website ke HTML jaisa nahi hota. Gmail, Outlook aur baaqi
// clients <style> block nikaal dete hain, aur flexbox/grid support hi nahi
// karte. Is liye yahan sirf **inline styles** hain aur layout bilkul sada hai.
//
// Har template `text` bhi deta hai. Sirf HTML bhejna do wajah se bura hai: kuch
// log plain-text mode mein parhte hain, aur spam filters HTML-only email ko
// shak ki nazar se dekhte hain.

// Naam banda khud likhta hai aur wo seedha HTML mein ja raha hai. Email clients
// script nahi chalate, magar `<` `>` wala naam email ka markup tor sakta hai —
// aur yehi aadat website par XSS rokti hai. `&` ko sabse pehle badalna zaroori
// hai, warna hum apne hi &lt; ko dobara badal dete.
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Client par hum `toLocaleDateString(undefined, ...)` likhte hain — "undefined"
// ka matlab hai banday ke browser ka locale. Server par ye ghalat hoga: server
// ka locale banday ka locale nahi hai. Is liye yahan locale saaf likha hua hai.
const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const shell = (heading, rowsHtml, closingHtml) => `
<div style="font-family: Arial, Helvetica, sans-serif; color: #22242c; line-height: 1.6; font-size: 15px; max-width: 560px;">
  <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600;">${heading}</h2>
  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0 0 18px;">
    ${rowsHtml}
  </table>
  ${closingHtml}
  <p style="margin: 26px 0 0; padding-top: 14px; border-top: 1px solid #e2e3e8; font-size: 12px; color: #6b6f80;">
    EventSphere — you're receiving this because you registered on our site.
  </p>
</div>`;

// Ek row: label bayen, qeemat dayen. Khaali qeemat par poori row gayab.
const row = (label, value) =>
  value
    ? `<tr>
         <td style="padding: 3px 16px 3px 0; color: #6b6f80; white-space: nowrap;">${escapeHtml(label)}</td>
         <td style="padding: 3px 0; font-weight: 600;">${escapeHtml(value)}</td>
       </tr>`
    : "";

// Attendee ne kaamyabi se register kar liya.
const registrationConfirmation = ({
  name,
  eventTitle,
  eventDate,
  startTime,
  endTime,
  location,
  ticketType,
}) => {
  const dateLine = formatDate(eventDate);
  const timeLine = startTime && endTime ? `${startTime} - ${endTime}` : startTime || "";

  const subject = `You're registered - ${eventTitle}`;

  // .filter(Boolean) yahan istemaal NAHI kiya, kyunke wo khaali strings (yani
  // hamari jaan boojh kar daali hui khaali lines) bhi kha jata aur poora matn
  // ek jhund ban jata. `!== null` sirf ghaayeb rows nikaalta hai.
  const text = [
    `Hi ${name},`,
    ``,
    `Your registration is confirmed for ${eventTitle}.`,
    ``,
    `Date: ${dateLine}`,
    timeLine ? `Time: ${timeLine}` : null,
    location ? `Venue: ${location}` : null,
    ticketType ? `Ticket: ${ticketType}` : null,
    ``,
    `At the venue, the desk can look you up by this email address.`,
    ``,
    `EventSphere`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = shell(
    `You're registered, ${escapeHtml(name)}`,
    [
      row("Event", eventTitle),
      row("Date", dateLine),
      row("Time", timeLine),
      row("Venue", location),
      row("Ticket", ticketType),
    ].join(""),
    `<p style="margin: 0;">At the venue, the desk can look you up by this email address.</p>`
  );

  return { subject, text, html };
};

module.exports = { registrationConfirmation };