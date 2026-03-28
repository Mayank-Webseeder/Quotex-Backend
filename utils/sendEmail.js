const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
  try {
    // 👉 Agar credentials nahi hai to console mode
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("message:", text);
      return;
    }

    // 👉 Real email (future use)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });

    console.log("✅ Email sent");
  } catch (error) {
    console.log("❌ Email error:", error);
  }
};

module.exports = sendEmail;
