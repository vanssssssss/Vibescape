import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;

if (!smtpUser || !smtpPassword) {
  throw new Error("SMTP credentials missing");
}

//connecting SMTP server
const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // Use true for port 465, false for port 587
        auth: {
            user: smtpUser,
            pass: smtpPassword,
        },
    });

export async function sendResetMail(
    email: string,
    resetUrl: string
){
    const info = await transporter.sendMail({
        from: `"Vibescape" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Reset your password",
        text: `Reset your password using this link:
            ${resetUrl}

        This link expires in 15 minutes.`,
    });
    console.log(nodemailer.getTestMessageUrl(info));
}
