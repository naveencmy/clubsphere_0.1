import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Pause, Play } from 'lucide-react';
import { Currency, LinkButton } from '../../components/common/UI.jsx';
import { date } from '../../utils/format.js';

export default function EventSlideshow({ events, tiers }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  const rotating = events.length > 1 && !paused && !hovered && !focused && !reducedMotion;
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((current) => (current + 1) % events.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [rotating, events.length]);

  if (!events.length) {
    return (
      <aside className="landing-slideshow landing-slideshow-empty">
        <CalendarDays size={32} aria-hidden="true" />
        <h2>Your next experience is on its way.</h2>
        <p className="muted">Check the event hub for the latest from your community.</p>
        <LinkButton to="/events">View events</LinkButton>
      </aside>
    );
  }

  const activeIndex = index % events.length;
  const event = events[activeIndex];
  const tier = tiers.find((item) => item.eventId === event.id);
  const move = (offset) =>
    setIndex((current) => (current + offset + events.length) % events.length);

  return (
    <div
      className="landing-slideshow"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured campus events"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="landing-slide-heading">
        <span className="eyebrow">On your campus</span>
        {!reducedMotion && events.length > 1 && (
          <button
            className="landing-slide-control"
            aria-label={paused ? 'Play event slideshow' : 'Pause event slideshow'}
            onClick={() => setPaused(!paused)}
          >
            {paused ? (
              <Play size={16} aria-hidden="true" />
            ) : (
              <Pause size={16} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      <div aria-live={rotating ? 'off' : 'polite'} aria-atomic="true">
        <article
          className="landing-slide"
          key={event.id}
          aria-roledescription="slide"
          aria-label={`${activeIndex + 1} of ${events.length}`}
        >
          <div
            className="landing-slide-poster"
            aria-hidden="true"
            style={{ overflow: 'hidden', position: 'relative' }}
          >
            {event.imageUrl ? (
              <img
                src={event.imageUrl}
                alt={event.title}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  borderRadius: 'inherit',
                }}
              />
            ) : (
              <>
                <CalendarDays className="landing-slide-calendar" strokeWidth={1} />
                <div className="landing-slide-date">
                  <span>
                    {new Intl.DateTimeFormat('en-IN', {
                      month: 'long',
                      timeZone: 'Asia/Kolkata',
                    }).format(new Date(event.startsAt))}
                  </span>
                  <strong>
                    {new Intl.DateTimeFormat('en-IN', {
                      day: '2-digit',
                      timeZone: 'Asia/Kolkata',
                    }).format(new Date(event.startsAt))}
                  </strong>
                </div>
                <span className="landing-slide-category">{event.category}</span>
              </>
            )}
          </div>
          <div className="landing-slide-copy">
            <h2>{event.title}</h2>
            <p>
              <CalendarDays size={16} aria-hidden="true" />
              <time dateTime={event.startsAt}>{date(event.startsAt)}</time>
            </p>
            <p>
              <MapPin size={16} aria-hidden="true" />
              <span>{event.venue}</span>
            </p>
            <div className="landing-slide-action">
              <span className="caption muted">
                From <Currency amount={tier?.publicPrice} />
              </span>
              <LinkButton to={`/events/${event.id}`}>
                View event <ArrowRight size={16} aria-hidden="true" />
              </LinkButton>
            </div>
          </div>
        </article>
      </div>
      {events.length > 1 && (
        <div className="landing-slide-navigation">
          <button
            className="landing-slide-control"
            aria-label="Previous event"
            onClick={() => move(-1)}
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <div className="landing-slide-dots" aria-label="Choose an event">
            {events.map((item, slideIndex) => (
              <button
                key={item.id}
                className="landing-slide-dot"
                aria-label={`Show event ${slideIndex + 1}: ${item.title}`}
                aria-current={activeIndex === slideIndex ? 'true' : undefined}
                onClick={() => setIndex(slideIndex)}
              >
                <span />
              </button>
            ))}
          </div>
          <button className="landing-slide-control" aria-label="Next event" onClick={() => move(1)}>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
