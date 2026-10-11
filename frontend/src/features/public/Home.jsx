import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, CreditCard, Ticket, Users, MapPin } from 'lucide-react';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { Avatar, Currency, LinkButton, ViewLink } from '../../components/common/UI.jsx';
import ProductArt from '../../components/common/ProductArt.jsx';
import EventSlideshow from './EventSlideshow.jsx';
import ScrollBend from '../../components/ui/ScrollBend.jsx';
import Pricing13 from '../../components/ui/Pricing13.jsx';
import { date } from '../../utils/format.js';
import '../../styles/landing.css';

export default function Home() {
  const { data } = useApp();
  const navigate = useNavigate();

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

      {/* React Bits Pro: Scroll Bend Event Ribbon with Staggered Card Sizes */}
      <ScrollBend
        events={data.events}
        tiers={data.tiers}
        title="Coming up on campus"
        eyebrow="Make time for something good"
      />

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

      {/* React Bits Pro: Pricing 13 Interactive Plan Picker with Live Detail Panel */}
      <Pricing13
        plans={data.plans}
        currentMembership={data.membership}
        onSelectPlan={() => navigate('/membership')}
        title="One pass. A world of possibility."
        subtitle="Your community, always within reach. Join a club and make the most of exclusive workshops, hackathons, and member rates."
      />

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
              <ProductArt
                kind={product.visual}
                image={product.image || product.images?.[0]}
                title={product.title}
              />
              <div>
                <h3>{product.title}</h3>
                <ArrowRight size={16} aria-hidden="true" />
              </div>
              <span className="muted caption">
                From{' '}
                <Currency
                  amount={
                    data.variants.find((v) =>
                      v.productId === product.id ||
                      v.productId === product.slug ||
                      v.productId === product.backendId ||
                      (product.slug?.includes('hoodie') && (v.productId === 'hoodie' || v.sku?.includes('HOODIE'))) ||
                      (product.slug?.includes('polo') && (v.productId === 'polo' || v.sku?.includes('POLO'))) ||
                      (product.slug?.includes('badge') && (v.productId === 'badge' || v.sku?.includes('BADGE'))),
                    )?.publicPrice || product.publicPrice || 45000
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
