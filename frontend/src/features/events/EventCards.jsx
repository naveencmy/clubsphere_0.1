import { Link } from 'react-router-dom';
import { Music2, Shapes, Users, CalendarDays, MapPin } from 'lucide-react';
import { Card, Badge, LinkButton, Currency } from '../../components/common/UI.jsx';
import { date } from '../../utils/format.js';
export function EventArt({ event }) {
  if (event.imageUrl) {
    return (
      <div className="event-art with-poster" style={{ overflow: 'hidden', padding: 0 }}>
        <img
          src={event.imageUrl}
          alt={event.title}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }
  const Icon = event.visual === 'gala' ? Music2 : event.visual === 'design' ? Shapes : Users;
  return (
    <div className={`event-art ${event.visual || 'meet'}`}>
      <span className="art-category">{event.category || 'Event'} · Nandha Campus</span>
      <span className="art-title">{event.title}</span>
      <Icon aria-hidden="true" />
    </div>
  );
}
export function EventCard({ event, tiers = [], manage = false, clubSlug = 'nec-cse' }) {
  const tier = tiers.find((t) => t.eventId === event.id || t.eventId === event.slug);
  return (
    <Card className="event-card">
      <EventArt event={event} />
      <div className="card-body">
        <div>
          <Badge value={event.category} />
        </div>
        <h3>
          <Link to={`/events/${event.id}`}>{event.title}</Link>
        </h3>
        <p className="muted row caption">
          <CalendarDays size={14} />
          {date(event.startsAt)}
        </p>
        <p className="muted row caption">
          <MapPin size={14} />
          {event.venue}
        </p>
        <div className="row between" style={{ marginTop: 'auto', gap: 8, flexWrap: 'wrap' }}>
          <span className="caption muted">
            From <Currency amount={tier?.publicPrice || 0} />
          </span>
          <div className="row" style={{ gap: 8 }}>
            <LinkButton to={`/events/${event.id}`}>View event</LinkButton>
            {manage && (
              <LinkButton to={`/dashboard/${clubSlug}/events/${event.id}/edit`}>
                Edit event
              </LinkButton>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
