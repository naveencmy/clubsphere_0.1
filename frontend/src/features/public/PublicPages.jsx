import { useEffect } from 'react';
import { authService } from '../../services/serviceFactory.js';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CreditCard,
  Users,
  Ticket,
  ShieldCheck,
  ShoppingBag,
  CircleCheck,
} from 'lucide-react';
import { useApp } from '../../app/providers/AppProvider.jsx';
import {
  Card,
  PageHeader,
  LinkButton,
  Badge,
  Avatar,
  Currency,
  ViewLink,
  Empty,
} from '../../components/common/UI.jsx';
import { EventCard } from '../events/EventCards.jsx';
import ProductArt from '../../components/common/ProductArt.jsx';
import { date } from '../../utils/format.js';
export function Home() {
  const { data } = useApp();
  return (
    <>
      <section className="hero">
        <div className="stack">
          <span className="eyebrow">A little more community. A lot more possibility.</span>
          <h1>
            Campus life,
            <br />
            better together.
          </h1>
          <p>
            Find your people. Show up for what you love. ClubSphere brings your memberships, events
            and everyday club life into one place.
          </p>
          <div className="row">
            <LinkButton primary to="/clubs">
              Find your community <ArrowRight size={16} />
            </LinkButton>
            <LinkButton to="/events">Explore events</LinkButton>
          </div>
          <div className="row muted caption">
            <ShieldCheck size={16} /> Built around the way student communities work.
          </div>
        </div>
        <div className="hero-preview">
          <Card title="Your campus, connected" action={<Badge tone="info">2026–27</Badge>}>
            <div className="card-body stack small">
              <div className="row">
                <Avatar name={data.club.name} large />
                <div>
                  <h3>{data.club.name}</h3>
                  <p className="caption muted">More than a club. Your community.</p>
                </div>
              </div>
              <div className="grid two">
                <div>
                  <p className="caption muted">Coming up next</p>
                  <strong>{data.events[0]?.title}</strong>
                </div>
                <div>
                  <p className="caption muted">Your essentials</p>
                  <div className="row">
                    <CreditCard size={16} />
                    <Ticket size={16} />
                    <ShoppingBag size={16} />
                  </div>
                </div>
              </div>
            </div>
            {data.events.slice(1, 3).map((e) => (
              <div className="list-item" key={e.id}>
                <div className="row">
                  <CalendarDays size={20} />
                  <div>
                    <h3>{e.title}</h3>
                    <p>
                      {date(e.startsAt)} · {e.venue}
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} />
              </div>
            ))}
          </Card>
        </div>
      </section>
      <section className="public-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">Make room in your calendar</span>
            <h2 style={{ marginTop: 8 }}>There’s something for you.</h2>
            <p>Meetups, workshops and nights you’ll talk about all semester.</p>
          </div>
          <ViewLink to="/events">All upcoming events</ViewLink>
        </div>
        <div className="grid three">
          {data.events.slice(0, 3).map((e) => (
            <EventCard key={e.id} event={e} tiers={data.tiers} />
          ))}
        </div>
      </section>
      <section className="public-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">Find your people</span>
            <h2 style={{ marginTop: 8 }}>Small communities. Big possibilities.</h2>
          </div>
          <ViewLink to="/clubs">Discover clubs</ViewLink>
        </div>
        <div className="grid two">
          {data.clubs.map((c) => (
            <Card key={c.id}>
              <div className="card-body stack small">
                <Avatar name={c.name} large />
                <h3>{c.name}</h3>
                <p className="muted">{c.description}</p>
                <ViewLink to={`/clubs/${c.slug}`}>Meet the club</ViewLink>
              </div>
            </Card>
          ))}
        </div>
      </section>
      <section className="public-section">
        <div className="grid two">
          <div className="stack">
            <span className="eyebrow">Membership that gives back</span>
            <h2>
              A place to belong.
              <br />
              Benefits that go with you.
            </h2>
            <p className="muted">
              Your member pass unlocks better ticket prices, merchandise savings and a community
              that knows your name.
            </p>
            <div>
              <LinkButton primary to="/membership">
                Explore membership <ArrowRight size={16} />
              </LinkButton>
            </div>
          </div>
          <div className="stack small">
            {[
              ['One digital pass', CreditCard, 'Your membership, always in your pocket.'],
              [
                'More experiences for less',
                Ticket,
                'Member prices on tickets and club merchandise.',
              ],
              ['Stay in the loop', Users, 'Official announcements, without the chat noise.'],
            ].map(([title, Icon, description]) => (
              <div className="row" key={title}>
                <span className="metric-icon">
                  <Icon size={20} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p className="muted">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="public-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">Wear your community</span>
            <h2 style={{ marginTop: 8 }}>Campus essentials.</h2>
          </div>
          <ViewLink to="/store">Shop the collection</ViewLink>
        </div>
        <div className="grid three">
          {data.products.slice(0, 3).map((p) => (
            <Card key={p.id}>
              <ProductArt kind={p.visual} />
              <div className="card-body stack small">
                <h3>{p.title}</h3>
                <div className="row between">
                  <Currency amount={data.variants.find((v) => v.productId === p.id)?.publicPrice} />
                  <ViewLink to={`/store/${p.id}`}>Take a look</ViewLink>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
      <section className="public-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">From your community</span>
            <h2 style={{ marginTop: 8 }}>The latest, all in one place.</h2>
          </div>
          <ViewLink to="/announcements">Announcement hub</ViewLink>
        </div>
        {data.announcements
          .filter((a) => a.audience === 'PUBLIC')
          .slice(0, 2)
          .map((a) => (
            <article className="card announcement" key={a.id}>
              <time className="caption muted" dateTime={a.publishedAt}>
                {date(a.publishedAt)}
              </time>
              <h3>{a.title}</h3>
              <p className="muted">{a.content}</p>
            </article>
          ))}
      </section>
      <section className="public-section">
        <div className="grid three">
          {[
            'Discover a club that feels like you',
            'Choose your membership and join',
            'Bring your pass. Make yourself at home.',
          ].map((step, i) => (
            <div className="stack small" key={step}>
              <span className="eyebrow">0{i + 1}</span>
              <h3>{step}</h3>
            </div>
          ))}
        </div>
      </section>
      <section className="welcome">
        <div className="stack small">
          <h2>Your next chapter starts on campus.</h2>
          <p>A new idea, a new friend, a new place to belong.</p>
        </div>
        <LinkButton to="/register">
          Let’s get started <ArrowRight size={16} />
        </LinkButton>
      </section>
    </>
  );
}
export function Clubs() {
  const { data } = useApp(),
    { slug } = useParams();
  const c = slug ? data.clubs.find((c) => c.slug === slug) : null;
  useEffect(() => {
    if (c && c.id !== data.club.id) authService.switchClub(c.id);
  }, [c?.id, data.club.id]);
  if (slug && !c)
    return (
      <Empty title="Club not found" action={<LinkButton to="/clubs">Browse clubs</LinkButton>} />
    );
  return (
    <div className="stack">
      <PageHeader
        title={c?.name || 'Find your community'}
        description={
          c?.description || 'Find the people, ideas and experiences that make campus yours.'
        }
      />
      {c ? (
        <>
          <Card>
            <div className="card-body stack">
              <Avatar name={c.name} large />
              <Badge>{c.category}</Badge>
              <p>{c.description}</p>
              <p className="muted">Find us at {c.location}</p>
              <LinkButton primary to="/membership">
                Join this community
              </LinkButton>
            </div>
          </Card>
          <div className="grid three">
            {data.events
              .filter((e) => e.clubId === c.id)
              .map((e) => (
                <EventCard event={e} tiers={data.tiers} key={e.id} />
              ))}
          </div>
        </>
      ) : (
        <div className="grid two">
          {data.clubs.map((c) => (
            <Card key={c.id}>
              <div className="card-body stack">
                <Avatar name={c.name} large />
                <h2>{c.name}</h2>
                <p className="muted">{c.description}</p>
                <Badge>{c.category}</Badge>
                <LinkButton to={`/clubs/${c.slug}`}>
                  Discover club <ArrowRight size={16} />
                </LinkButton>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
