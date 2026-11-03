import nodemailer from "nodemailer";
import { EVENT } from "../config/event.js";

let transporter;
export const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  return transporter;
};

const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

export const buildTicketEmail = ({ name, ticketNumber }) => {
  const n = escapeHtml(name);
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#000;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:24px 12px;">
 <tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0a0a0a;border:1px solid #262626;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#f4f4f4;">
   <tr><td style="padding:32px 28px 8px;text-align:center;">
     <div style="font-size:34px;font-weight:900;letter-spacing:1px;color:#9c9c9c;"><span style="color:#fff;">FIT</span> COMBAT</div>
     <div style="margin-top:8px;font-size:13px;font-weight:700;letter-spacing:5px;color:#fff;">${EVENT.subtitle}</div>
     <div style="width:150px;height:4px;background:#e5251d;margin:10px auto 0;"></div>
   </td></tr>
   <tr><td style="padding:24px 28px 0;text-align:center;">
     <p style="margin:0 0 6px;font-size:18px;font-weight:700;">You’re in, ${n}! 💪</p>
     <p style="margin:0;font-size:14px;color:#b5b5b5;line-height:1.6;">Your payment was confirmed. Your ticket is attached to this email as a PDF — save it or screenshot it and show it at the entrance.</p>
   </td></tr>
   <tr><td style="padding:24px 28px;" align="center">
     <table role="presentation" cellpadding="0" cellspacing="0" style="background:#DDB18C;border-radius:12px;width:100%;">
       <tr><td style="padding:16px;text-align:center;color:#0a0a0a;">
         <div style="font-size:11px;font-weight:700;letter-spacing:3px;">TICKET NUMBER</div>
         <div style="font-size:30px;font-weight:900;letter-spacing:2px;">${ticketNumber}</div>
       </td></tr>
     </table>
   </td></tr>
   <tr><td style="padding:0 28px 8px;">
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
       <tr><td style="padding:8px 0;color:#8a8a8a;width:90px;">Date</td><td style="padding:8px 0;font-weight:700;">${EVENT.dateLabel}</td></tr>
       <tr><td style="padding:8px 0;color:#8a8a8a;border-top:1px solid #1f1f1f;">Time</td><td style="padding:8px 0;font-weight:700;border-top:1px solid #1f1f1f;">${EVENT.timeLabel}</td></tr>
       <tr><td style="padding:8px 0;color:#8a8a8a;border-top:1px solid #1f1f1f;vertical-align:top;">Venue</td><td style="padding:8px 0;font-weight:700;border-top:1px solid #1f1f1f;">${EVENT.venueName}<br><span style="font-weight:400;color:#b5b5b5;">${EVENT.venueAddress}</span></td></tr>
     </table>
   </td></tr>
   <tr><td style="padding:20px 28px 30px;text-align:center;font-size:12px;color:#8a8a8a;line-height:1.7;">
     Questions? ${EVENT.contactEmail} · ${EVENT.contactPhone}<br>
     Discipline · Focus · Endurance · Results
   </td></tr>
  </table>
 </td></tr>
</table>
</body></html>`;

  const text = `Hello ${name},

You're in! Your payment was confirmed.

Ticket number: ${ticketNumber}
Date: ${EVENT.dateLabel}
Time: ${EVENT.timeLabel}
Venue: ${EVENT.venueName}, ${EVENT.venueAddress}

Your ticket (PDF) is attached. Show it at the entrance.

FIT COMBAT Challenge Zone
${EVENT.contactEmail} | ${EVENT.contactPhone}`;

  return { html, text };
};

export const sendTicketEmail = async (ticket, pdfBuffer) => {
  const { html, text } = buildTicketEmail(ticket);
  await getTransporter().sendMail({
    from: `"FIT COMBAT" <${process.env.EMAIL_USER}>`,
    to: ticket.email,
    subject: `Your FIT COMBAT ticket — ${ticket.ticketNumber}`,
    text,
    html,
    attachments: [
      {
        filename: `${ticket.ticketNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
};
