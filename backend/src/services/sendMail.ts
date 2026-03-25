import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;

if (!smtpUser || !smtpPassword) {
  throw new Error("SMTP credentials missing");
}

//connecting SMTP server
const transporter = nodemailer.createTransport({
        service: "gmail",
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
    // console.log(nodemailer.getTestMessageUrl(info));
}

export async function sendMailVerification(
    email: string,
    Url: string
){
    const info = await transporter.sendMail({
        from: `"Vibescape" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Verify your email address",
        text: `:
        Hi explorers,
        Click on link below to verify your email:
            ${Url}
        This code will expire in 15 minutes.
        If you did not request this, ignore this email.
        Vibescape`,
    });
}

