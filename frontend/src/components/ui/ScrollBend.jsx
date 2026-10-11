import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useScroll,
  useVelocity,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'motion/react';
import { ArrowLeft, ArrowRight, Calendar, MapPin, Sparkles, Ticket } from 'lucide-react';
import { Currency } from '../common/UI.jsx';
import './ScrollBend.css';

// Preset responsive card size variants for organic editorial rhythm
const SIZE_VARIANTS = ['poster', 'landscape', 'square', 'tall', 'wide'];

export default function ScrollBend({
  events = [],
  tiers = [],
  title = 'Coming up on campus',
  eyebrow = 'Make time for something good',
  subtitle = 'Discover technical symposiums, hackathons, and hands-on workshops hosted by your college clubs.',
  className = '',
}) {
  const containerRef = useRef(null);
  const viewportRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const reducedMotion = useReducedMotion();

  // Vertical scroll physics for 3D bulge and pinch bending
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 45,
    stiffness: 350,
  });

  // Bulge, pitch, and skew transforms mapped to scroll velocity
  const rotateX = useTransform(smoothVelocity, [-3000, 0, 3000], [14, 0, -14]);
  const skewY = useTransform(smoothVelocity, [-3000, 0, 3000], [-3.5, 0, 3.5]);
  const scaleY = useTransform(smoothVelocity, [-3000, 0, 3000], [0.95, 1, 0.95]);
  const bulgeZ = useTransform(smoothVelocity, [-3000, 0, 3000], [-35, 0, -35]);

  const updateScrollButtons = () => {
    const el = viewportRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [events]);

  const scrollBy = (offset) => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  if (!events || events.length === 0) return null;

  return (
    <div ref={containerRef} className={`scroll-bend-container ${className}`}>
      <div className="scroll-bend-header">
        <div className="scroll-bend-heading">
          <span className="scroll-bend-eyebrow">
            <Sparkles size={15} />
            {eyebrow}
          </span>
          <h2 className="scroll-bend-title">{title}</h2>
          {subtitle && <p className="scroll-bend-subtitle">{subtitle}</p>}
        </div>
        <div className="scroll-bend-controls">
          <button
            type="button"
            className="scroll-bend-btn"
            aria-label="Previous events"
            disabled={!canScrollLeft}
            onClick={() => scrollBy(-380)}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            className="scroll-bend-btn"
            aria-label="Next events"
            disabled={!canScrollRight}
            onClick={() => scrollBy(380)}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div ref={viewportRef} className="scroll-bend-viewport">
        <motion.div
          className="scroll-bend-track"
          style={
            reducedMotion
              ? {}
              : {
                  rotateX,
                  skewY,
                  scaleY,
                  z: bulgeZ,
                }
          }
        >
          {events.map((event, idx) => {
            const sizeType = SIZE_VARIANTS[idx % SIZE_VARIANTS.length];
            const eventTier = tiers.find((t) => t.eventId === event.id || t.eventId === event.slug);
            const isFeatured =
              idx === 0 || event.category === 'HACKATHON' || event.title.includes('SYNECTICS');
            const startDate = new Date(event.startsAt || Date.now());
            const monthName = new Intl.DateTimeFormat('en-IN', {
              month: 'short',
              timeZone: 'Asia/Kolkata',
            }).format(startDate);
            const dayNum = new Intl.DateTimeFormat('en-IN', {
              day: '2-digit',
              timeZone: 'Asia/Kolkata',
            }).format(startDate);

            return (
              <div key={event.id || idx} className="scroll-bend-card-wrap">
                <Link
                  to={`/events/${event.id || event.slug}`}
                  className={`scroll-bend-card scroll-bend-card--${sizeType}`}
                >
                  <div className="scroll-bend-card-media">
                    <img
                      src={
                        event.imageUrl ||
                        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={event.title}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="scroll-bend-card-overlay" />

                    <span
                      className={`scroll-bend-card-badge ${
                        isFeatured ? 'scroll-bend-card-badge--featured' : ''
                      }`}
                    >
                      {isFeatured ? '★ Featured Event' : event.category || 'CAMPUS EVENT'}
                    </span>

                    <div className="scroll-bend-card-date">
                      <span className="scroll-bend-card-date-month">{monthName}</span>
                      <span className="scroll-bend-card-date-day">{dayNum}</span>
                    </div>
                  </div>

                  <div className="scroll-bend-card-info">
                    <div className="scroll-bend-card-meta">
                      <span>{event.tags?.[0] || 'Official CSE Club'}</span>
                      <span>{event.capacity ? `${event.capacity} seats` : 'Open Entry'}</span>
                    </div>

                    <h3 className="scroll-bend-card-title">{event.title}</h3>

                    <div className="scroll-bend-card-venue">
                      <MapPin size={13} />
                      <span>{event.venue || 'Campus Auditorium'}</span>
                    </div>

                    <div className="scroll-bend-card-footer">
                      <div className="scroll-bend-card-price">
                        {eventTier ? (
                          <>
                            <small>From </small>
                            <Currency amount={eventTier.memberPrice ?? eventTier.publicPrice} />
                          </>
                        ) : (
                          <span>Free Entry</span>
                        )}
                      </div>
                      <span className="scroll-bend-card-cta">
                        View Event <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
