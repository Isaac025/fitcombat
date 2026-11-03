import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import { fileURLToPath } from "url";
import { EVENT } from "../config/event.js";

const asset = (p) => fileURLToPath(new URL(`../assets/${p}`, import.meta.url));

const BANNER = fs.readFileSync(asset("ticket-banner.jpg"));

// Palette = the flyer
const BG = "#0a0a0a";
const STEEL = "#9c9c9c";
const RED = "#e5251d";
const GOLD = "#f9b233";
const MUTED = "#8a8a8a";

const W = 800;
const H = 340;
const STUB_X = 560;

/**
 * Builds the ticket PDF fully in memory and resolves with a Buffer
 * (so we never email a half-written file).
 */
export const generateTicketPdf = async ({ name, ticketNumber }) => {
  const qrPng = await QRCode.toBuffer(`FITCOMBAT:${ticketNumber}`, {
    margin: 0,
    width: 320,
    errorCorrectionLevel: "M",
  });

  const doc = new PDFDocument({
    size: [W, H],
    margin: 0,
    info: { Title: `FIT COMBAT Ticket ${ticketNumber}`, Author: "FIT COMBAT" },
  });
  doc.registerFont("Bold", asset("fonts/Poppins-Bold.ttf"));
  doc.registerFont("Medium", asset("fonts/Poppins-Medium.ttf"));
  // Poppins has no ₦ glyph, so the price uses a font that does.
  doc.registerFont("Naira", asset("fonts/LiberationSans-Bold.ttf"));

  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const finished = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  /* ---------- Background + photo ---------- */
  doc.rect(0, 0, W, H).fill(BG);

  doc.save();
  doc.rect(0, 0, STUB_X, H).clip();
  doc.image(BANNER, 0, 0, { width: STUB_X }); // ~228pt tall
  const fade = doc.linearGradient(0, 60, 0, 232);
  fade.stop(0, BG, 0).stop(1, BG, 1);
  doc.rect(0, 60, STUB_X, 172).fill(fade);
  doc.restore();

  /* ---------- Title ---------- */
  doc.font("Bold").fontSize(46);
  const fitW = doc.widthOfString("FIT");
  doc
    .fillColor(BG)
    .strokeColor("#ffffff")
    .lineWidth(1.4)
    .text("FIT", 36, 146, { fill: true, stroke: true, lineBreak: false });
  doc
    .fillColor(STEEL)
    .text("COMBAT", 36 + fitW + 14, 146, { lineBreak: false });

  doc
    .font("Bold")
    .fontSize(11.5)
    .fillColor("#ffffff")
    .text(EVENT.subtitle, 38, 203, { characterSpacing: 5, lineBreak: false });
  // red slanted underline
  doc
    .moveTo(40, 222).lineTo(222, 222).lineTo(216, 226.5).lineTo(34, 226.5)
    .closePath()
    .fill(RED);

  /* ---------- Details ---------- */
  const label = (text, x, y) =>
    doc.font("Medium").fontSize(7).fillColor(MUTED).text(text, x, y, { characterSpacing: 2, lineBreak: false });
  const value = (text, x, y, opts = {}) =>
    doc.font("Bold").fontSize(10).fillColor("#ffffff").text(text, x, y, { lineBreak: false, ...opts });

  label("DATE", 36, 244);
  value(EVENT.dateLabel, 36, 256);
  label("TIME", 190, 244);
  value(EVENT.timeLabel, 190, 256);
  label("VENUE", 340, 244);
  value(EVENT.venueName, 340, 256);
  doc.font("Medium").fontSize(7.5).fillColor(MUTED)
    .text(EVENT.venueAddress, 340, 270, { width: 205, lineBreak: true });

  label("ATTENDEE", 36, 296);
  doc.font("Bold").fontSize(12).fillColor(GOLD)
    .text(name.toUpperCase(), 36, 307, { width: 300, height: 16, ellipsis: true });

  doc.font("Medium").fontSize(7).fillColor("#5e5e5e")
    .text(`${EVENT.contactEmail}   •   ${EVENT.contactPhone}`, 340, 312, { width: 215, lineBreak: false });

  /* ---------- Gold stub ---------- */
  doc.rect(STUB_X, 0, W - STUB_X, H).fill(GOLD);
  const cx = STUB_X + (W - STUB_X) / 2;
  const stubOpts = { width: W - STUB_X, align: "center", lineBreak: false };

  doc.font("Medium").fontSize(8).fillColor("#1a1a1a")
    .text("TICKET NO.", STUB_X, 28, { ...stubOpts, characterSpacing: 3 });
  doc.font("Bold").fontSize(27).fillColor("#0a0a0a")
    .text(ticketNumber, STUB_X, 40, stubOpts);

  doc.roundedRect(cx - 64, 84, 128, 128, 8).fill("#ffffff");
  doc.image(qrPng, cx - 56, 92, { width: 112, height: 112 });

  doc.font("Bold").fontSize(9).fillColor("#0a0a0a")
    .text("ADMIT ONE", STUB_X, 226, { ...stubOpts, characterSpacing: 3 });
  doc.font("Naira").fontSize(21).fillColor("#0a0a0a")
    .text(`₦${EVENT.priceNaira.toLocaleString("en-NG")}`, STUB_X, 244, stubOpts);
  doc.font("Medium").fontSize(7.5).fillColor("#1a1a1a")
    .text("Show this ticket at the entrance", STUB_X, 288, stubOpts);

  // perforation + notches
  doc.save();
  doc.strokeColor("#00000066").lineWidth(1.2).dash(5, { space: 4 })
    .moveTo(STUB_X, 14).lineTo(STUB_X, H - 14).stroke();
  doc.undash().restore();
  doc.circle(STUB_X, 0, 13).fill(BG);
  doc.circle(STUB_X, H, 13).fill(BG);

  doc.end();
  return finished;
};
