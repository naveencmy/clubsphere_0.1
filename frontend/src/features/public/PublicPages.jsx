import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { authService } from '../../services/serviceFactory.js';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { Card, PageHeader, LinkButton, Badge, Avatar, Empty } from '../../components/common/UI.jsx';
import { EventCard } from '../events/EventCards.jsx';
export { default as Home } from './Home.jsx';
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
