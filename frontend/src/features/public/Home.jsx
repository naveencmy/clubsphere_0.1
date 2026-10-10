import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, CreditCard, Ticket, Users, MapPin } from 'lucide-react';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { Avatar, Currency, LinkButton, ViewLink } from '../../components/common/UI.jsx';
import ProductArt from '../../components/common/ProductArt.jsx';
import EventSlideshow from './EventSlideshow.jsx';
import { date } from '../../utils/format.js';
import '../../styles/landing.css';

export default function Home() {
  const { data } = useApp();

  return (
    <div className="landing">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-intro">
          <span className="eyebrow">Your campus. One community.</span>
          <h1 id="landing-title">A simpler way to belong.</h1>
          <p className="landing-lead">
            Discover your people, find your next experience, and keep club life in one place.
            Welcome to ClubSphere.
          </p>
          <div className="landing-actions">
            <LinkButton primary to="/clubs">
              Discover clubs <ArrowRight size={16} aria-hidden="true" />
            </LinkButton>
            <LinkButton primary to="/register">
              Get started <ArrowRight size={16} aria-hidden="true" />
            </LinkButton>
          </div>
          <p className="landing-campus">For {data.club.name}</p>
        </div>
        <EventSlideshow events={data.events.slice(0, 3)} tiers={data.tiers} />
      </section>

      <div className="landing-shortcuts" aria-label="Explore ClubSphere">
        <Link to="/membership">
          <CreditCard size={20} aria-hidden="true" />
          <span>
            <strong>Your membership</strong>
            <span>A digital pass. More possibilities.</span>
          </span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link to="/events">
          <CalendarDays size={20} aria-hidden="true" />
          <span>
            <strong>What's on campus</strong>
            <span>Find something worth showing up for.</span>
          </span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link to="/announcements">
          <Users size={20} aria-hidden="true" />
          <span>
            <strong>Stay connected</strong>
            <span>The latest from your community.</span>
          </span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <section className="landing-section" aria-labelledby="landing-events">
        <div className="landing-section-heading">
          <div>
            <span className="eyebrow">Make time for something good</span>
            <h2 id="landing-events">Coming up on campus</h2>
          </div>
          <ViewLink to="/events">All events</ViewLink>
        </div>
        <div className="landing-events">
          {data.events.slice(0, 3).map((event) => (
            <Link className="landing-event" to={`/events/${event.id}`} key={event.id}>
              <time className="landing-event-date" dateTime={event.startsAt}>
                <span>
                  {new Intl.DateTimeFormat('en-IN', {
                    month: 'short',
                    timeZone: 'Asia/Kolkata',
                  }).format(new Date(event.startsAt))}
                </span>
                <strong>
                  {new Intl.DateTimeFormat('en-IN', {
                    day: '2-digit',
                    timeZone: 'Asia/Kolkata',
                  }).format(new Date(event.startsAt))}
                </strong>
              </time>
              <div className="landing-event-copy">
                <span className="caption muted">{event.category}</span>
                <h3>{event.title}</h3>
                <p>
                  <MapPin size={14} aria-hidden="true" />
                  {event.venue}
                </p>
              </div>
              <span className="landing-event-price">
                From{' '}
                <Currency
                  amount={data.tiers.find((tier) => tier.eventId === event.id)?.publicPrice}
                />
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-section" aria-labelledby="landing-clubs">
        <div className="landing-section-heading">
          <div>
            <span className="eyebrow">Find your people</span>
            <h2 id="landing-clubs">A community for every curiosity</h2>
          </div>
          <ViewLink to="/clubs">Browse clubs</ViewLink>
        </div>
        <div className="landing-club-grid">
          {data.clubs.map((club) => (
            <Link className="landing-club" key={club.id} to={`/clubs/${club.slug}`}>
              <div className="landing-club-top">
                <Avatar name={club.name} large />
                <ArrowRight size={18} aria-hidden="true" />
              </div>
              <span className="caption muted">{club.category}</span>
              <h3>{club.name}</h3>
              <p>{club.description}</p>
              <span className="landing-text-link">Meet the community</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-membership" aria-labelledby="landing-membership">
        <div className="landing-membership-copy">
          <span className="eyebrow">More than a membership</span>
          <h2 id="landing-membership">
            One pass.
            <br />A little more possibility.
          </h2>
          <p>
            Your community, always within reach. Join a club and make the most of everything it has
            to offer.
          </p>
          <LinkButton primary to="/membership">
            Explore membership <ArrowRight size={16} aria-hidden="true" />
          </LinkButton>
        </div>
        <div className="landing-benefits">
          <div>
            <CreditCard size={20} aria-hidden="true" />
            <div>
              <h3>Your digital member pass</h3>
              <p>Keep your membership ready, wherever campus takes you.</p>
            </div>
          </div>
          <div>
            <Ticket size={20} aria-hidden="true" />
            <div>
              <h3>Member prices, more experiences</h3>
              <p>Enjoy member savings on event tickets and club merchandise.</p>
            </div>
          </div>
          <div>
            <Users size={20} aria-hidden="true" />
            <div>
              <h3>A place to stay connected</h3>
              <p>Official updates and opportunities from the people you know.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="landing-store">
        <div className="landing-section-heading">
          <div>
            <span className="eyebrow">Made for your everyday</span>
            <h2 id="landing-store">Wear your community</h2>
          </div>
          <ViewLink to="/store">Shop merchandise</ViewLink>
        </div>
        <div className="landing-products">
          {data.products.slice(0, 3).map((product) => (
            <Link className="landing-product" to={`/store/${product.id}`} key={product.id}>
              <ProductArt kind={product.visual} />
              <div>
                <h3>{product.title}</h3>
                <ArrowRight size={16} aria-hidden="true" />
              </div>
              <span className="muted caption">
                From{' '}
                <Currency
                  amount={
                    data.variants.find((variant) => variant.productId === product.id)?.publicPrice
                  }
                />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-section" aria-labelledby="landing-news">
        <div className="landing-section-heading">
          <div>
            <span className="eyebrow">From your community</span>
            <h2 id="landing-news">The latest updates</h2>
          </div>
          <ViewLink to="/announcements">All announcements</ViewLink>
        </div>
        <div className="landing-announcements">
          {data.announcements
            .filter((announcement) => announcement.audience === 'PUBLIC')
            .slice(0, 2)
            .map((announcement) => (
              <article key={announcement.id}>
                <time className="caption muted" dateTime={announcement.publishedAt}>
                  {date(announcement.publishedAt)}
                </time>
                <h3>
                  <Link to="/announcements">{announcement.title}</Link>
                </h3>
                <p>{announcement.content}</p>
              </article>
            ))}
        </div>
      </section>

      <section className="landing-section" aria-labelledby="landing-start">
        <div className="landing-section-heading">
          <div>
            <span className="eyebrow">A good place to start</span>
            <h2 id="landing-start">Make campus yours</h2>
          </div>
        </div>
        <ol className="landing-steps">
          <li>
            <span className="eyebrow">01 / Discover</span>
            <h3>Find your community</h3>
            <p>Explore the clubs and ideas that feel like you.</p>
          </li>
          <li>
            <span className="eyebrow">02 / Join</span>
            <h3>Choose your membership</h3>
            <p>Find the right plan and get your digital pass.</p>
          </li>
          <li>
            <span className="eyebrow">03 / Show up</span>
            <h3>Be part of something</h3>
            <p>Meet new people. Make time for what you love.</p>
          </li>
        </ol>
      </section>

      <section className="landing-invitation" aria-labelledby="landing-invitation">
        <div>
          <h2 id="landing-invitation">Your next chapter starts here.</h2>
          <p>A new idea, a new friend, a new place to belong.</p>
        </div>
      </section>
    </div>
  );
}
