const nodemailer = require("nodemailer");

// Transporter ek hi baar banta hai aur phir dobara istemaal hota hai. Har email
// par naya banane ka matlab hai har baar naya SMTP connection banana aur torna —
// dheema, aur Gmail jaise servers ise pasand nahi karte.
let cachedTransporter = null;
let usingEtherealFallback = false;

const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  // Darja 1 — asli SMTP. Credentials .env se aate hain.
  // Note: Gmail par aap ka normal password kaam NAHI karta; wahan 2FA on karke
  // "App Password" banana parta hai. Filhaal is ki zaroorat nahi.
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_PORT) || 587,
      // 587 par encryption baad mein lagta hai (STARTTLS), is liye secure false.
      // Sirf port 465 ke liye ise true karna hota hai.
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    return cachedTransporter;
  }

  // Darja 2 — Ethereal. Nodemailer ka apna khilona SMTP server: khud account
  // bana deta hai, email qubool karta hai magar kisi asli inbox tak nahi
  // pohanchata, aur ek preview link deta hai jahan poori email nazar aati hai.
  // Development ke liye ye Gmail se behtar hai: kisi asli banday ko galti se
  // email nahi ja sakti.
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  usingEtherealFallback = true;
  console.log("[email] EMAIL_USER set nahi hai — Ethereal test inbox istemaal ho raha hai.");
  return cachedTransporter;
};

// Ye function jaan boojh kar **kabhi throw nahi karta**.
//
// Wajah samajhna zaroori hai: email registration ka hissa nahi, us ke baad ki
// ittila hai. Agar internet band ho, SMTP na chale, ya password ghalat ho — to
// bhi banday ki registration database mein mehfooz ho chuki hai. Us par error
// phenkne ka natija ye hota ke kaam ho jane ke baad banday ko "failed" dikhta,
// wo dobara koshish karta, aur use "You're already registered" milta. Is liye
// har naakami sirf console par log hoti hai, jawab par asar nahi dalti.
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Chup chaap wapas — walk-in registration par email khaali bhi ho sakti hai.
    if (!to) return;

    const transporter = await getTransporter();
    const from =
      process.env.EMAIL_FROM ||
      `EventSphere <${process.env.EMAIL_USER || "no-reply@eventsphere.local"}>`;

    const info = await transporter.sendMail({ from, to, subject, text, html });

    if (usingEtherealFallback) {
      console.log(`[email] "${subject}" -> ${to}`);
      // Yehi wo link hai jise browser mein khol kar asli email dekhi ja sakti hai.
      console.log(`[email] preview: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
      console.log(`[email] sent "${subject}" -> ${to}`);
    }
  } catch (error) {
    // Darja 3 — kuch bhi kaam na kare to email ka matn console par likh dete
    // hain. Kaam rukta nahi, aur development mein aap dekh sakte hain ke jana
    // kya tha. Deployment par ye log hi batata hai ke SMTP toota hua hai.
    console.error(`[email] FAILED "${subject}" -> ${to}: ${error.message}`);
    console.error(`[email] body:\n${text}`);
  }
};

module.exports = sendEmail;