import { useState } from "react";
import axios from "axios";
import { usePaystackPayment } from "react-paystack";
import { API_URL, EVENT, PAYSTACK_PUBLIC_KEY, formatNaira } from "../config";
import { CheckIcon, DownloadIcon, LockIcon } from "./Icons";

// A fresh, unique reference for every payment attempt.
const newReference = () =>
  `FC-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const TicketForm = () => {
  const [form, setForm] = useState({ name: "", email: "" });
  const [reference, setReference] = useState(newReference);
  // idle | paying | verifying | success | error
  const [status, setStatus] = useState("idle");
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [paidReference, setPaidReference] = useState(null);

  const name = form.name.trim();
  const email = form.email.trim();

  const initializePayment = usePaystackPayment({
    reference,
    email,
    amount: EVENT.price * 100, // Paystack works in kobo
    currency: "NGN",
    publicKey: PAYSTACK_PUBLIC_KEY,
    metadata: {
      name,
      custom_fields: [
        { display_name: "Full name", variable_name: "full_name", value: name },
        { display_name: "Event", variable_name: "event", value: "FIT COMBAT Challenge Zone" },
      ],
    },
  });

  // Ask our server to confirm the payment with Paystack. The server — not the
  // browser — decides whether a ticket is issued.
  const verifyPayment = async (ref) => {
    setStatus("verifying");
    setMessage("");
    try {
      const { data } = await axios.post(`${API_URL}/api/tickets/verify`, {
        reference: ref,
      });
      setTicket(data.ticket);
      setStatus("success");
    } catch (err) {
      setPaidReference(ref);
      setMessage(
        err.response?.data?.message ||
          "We couldn’t reach the server to confirm your payment.",
      );
      setStatus("error");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!PAYSTACK_PUBLIC_KEY) {
      setMessage("Payments are not configured yet (missing Paystack public key).");
      setStatus("error");
      setPaidReference(null);
      return;
    }
    setMessage("");
    setStatus("paying");
    initializePayment({
      onSuccess: (response) => {
        setPaidReference(response.reference);
        verifyPayment(response.reference);
      },
      // Fires when the popup is dismissed; ignore it if payment already went through.
      onClose: () => setStatus((s) => (s === "paying" ? "idle" : s)),
    });
  };

  const reset = () => {
    setForm({ name: "", email: "" });
    setTicket(null);
    setPaidReference(null);
    setMessage("");
    setReference(newReference());
    setStatus("idle");
  };

  /* ---------- Success ---------- */
  if (status === "success" && ticket) {
    return (
      <div className="form-card form-card--success" role="status">
        <span className="success-badge">
          <CheckIcon width={30} height={30} />
        </span>
        <h3>You’re in, {ticket.name.split(" ")[0]}!</h3>
        <p className="muted">Payment confirmed. Your ticket number is</p>
        <p className="success-number">{ticket.ticketNumber}</p>
        <p className="muted">
          {ticket.emailSent
            ? <>We’ve emailed your ticket (PDF) to <strong>{ticket.email}</strong>. Check your spam folder if you don’t see it in a few minutes.</>
            : <>Your email is taking longer than usual — you can download your ticket right now below.</>}
        </p>
        <a
          className="btn btn--gold btn--block"
          href={`${API_URL}/api/tickets/download/${encodeURIComponent(ticket.paystackReference)}`}
        >
          <DownloadIcon width={20} height={20} /> Download ticket
        </a>
        <button type="button" className="link-btn" onClick={reset}>
          Buy another ticket
        </button>
      </div>
    );
  }

  /* ---------- Paid, but confirmation failed ---------- */
  if (status === "error" && paidReference) {
    return (
      <div className="form-card" role="alert">
        <h3>Almost there</h3>
        <p className="notice notice--warn">{message}</p>
        <p className="muted">
          If you were charged, don’t pay again. Your payment reference is{" "}
          <strong className="ref">{paidReference}</strong>. Tap retry — or email{" "}
          <a href={`mailto:${EVENT.email}`}>{EVENT.email}</a> with that reference.
        </p>
        <button
          type="button"
          className="btn btn--gold btn--block"
          onClick={() => verifyPayment(paidReference)}
        >
          Retry confirmation
        </button>
      </div>
    );
  }

  /* ---------- Form ---------- */
  const busy = status === "paying" || status === "verifying";

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate={false}>
      <h3>Get your ticket</h3>
      <p className="muted">
        Your ticket is emailed to you as a PDF as soon as payment is confirmed.
      </p>

      <label className="field">
        <span>Full name</span>
        <input
          type="text"
          name="name"
          autoComplete="name"
          placeholder="e.g. Ada Okafor"
          required
          minLength={2}
          value={form.name}
          disabled={busy}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>

      <label className="field">
        <span>Email address</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          required
          value={form.email}
          disabled={busy}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <small>Your ticket will be sent here — double-check it.</small>
      </label>

      {status === "error" && !paidReference && (
        <p className="notice notice--warn" role="alert">{message}</p>
      )}

      <button type="submit" className="btn btn--gold btn--block" disabled={busy}>
        {status === "verifying"
          ? "Confirming your payment…"
          : status === "paying"
            ? "Complete payment in the popup…"
            : `Buy ticket — ${formatNaira(EVENT.price)}`}
      </button>

      <p className="secure">
        <LockIcon width={16} height={16} /> Secure payment by Paystack · Card, bank transfer & USSD
      </p>
    </form>
  );
};

export default TicketForm;
