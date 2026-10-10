import { Link } from 'react-router-dom';
import { Music2, Shapes, Users, CalendarDays, MapPin } from 'lucide-react';
import { Card, Badge, LinkButton, Currency } from '../../components/common/UI.jsx';
import { date } from '../../utils/format.js';
export function EventArt({ event }) {
  const Icon = event.visual === 'gala' ? Music2 : event.visual === 'design' ? Shapes : Users;
  return (
    <div className={`event-art ${event.visual}`}>
      <span className="art-category">{event.category} · Skyline campus</span>
      <span className="art-title">
        {event.visual === 'gala'
          ? 'A night to remember.'
          : event.visual === 'design'
            ? 'Make your next move.'
            : 'Find your people.'}
      </span>
      <Icon aria-hidden="true" />
    </div>
  );
}
export function EventCard({ event, tiers }) {
  const tier = tiers.find((t) => t.eventId === event.id);
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
        <div className="row between">
          <span className="caption muted">
            From <Currency amount={tier?.publicPrice} />
          </span>
          <LinkButton to={`/events/${event.id}`}>View event</LinkButton>
        </div>
      </div>
    </Card>
  );
}
