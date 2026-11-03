import { EVENT, formatNaira } from "../config";

// Decorative preview of what the emailed ticket looks like.
const bars = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 3, 1, 2, 4, 1, 2, 1, 1, 3, 2, 1, 4, 1, 2, 3, 1, 1, 2, 4, 1, 2, 1, 3];

const TicketPreview = () => (
  <div className="ticket" aria-label="Sample ticket design">
    <div className="ticket__main">
      <span className="ticket__sample">Sample</span>
      <p className="ticket__brand">
        <span className="ticket__fit">FIT</span> COMBAT
      </p>
      <p className="ticket__sub">CHALLENGE ZONE</p>
      <dl className="ticket__meta">
        <div>
          <dt>Date</dt>
          <dd>{EVENT.dateShort}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>7:00 – 9:00 AM</dd>
        </div>
        <div className="ticket__wide">
          <dt>Venue</dt>
          <dd>{EVENT.venueName}, Lekki Phase 1</dd>
        </div>
      </dl>
    </div>
    <div className="ticket__stub">
      <p className="ticket__stub-label">Ticket No.</p>
      <p className="ticket__number">FITC-0001</p>
      <div className="ticket__bars" aria-hidden="true">
        {bars.map((w, i) => (
          <span key={i} style={{ width: w * 2 }} />
        ))}
      </div>
      <p className="ticket__price">{formatNaira(EVENT.price)}</p>
    </div>
  </div>
);

export default TicketPreview;
