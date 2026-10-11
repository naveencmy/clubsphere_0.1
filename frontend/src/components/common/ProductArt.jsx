export default function ProductArt({ kind = 'hoodie', image = null, title = '' }) {
  if (image) {
    return (
      <div className="product-art with-photo" style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src={image}
          alt={title || `${kind} product illustration`}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/clubsphere-logo.png';
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(14, 165, 233, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
          title="ClubSphere Official Merchandise"
        >
          <img
            src="/images/clubsphere-logo.png"
            alt="ClubSphere Emblem"
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="product-art">
      <svg viewBox="0 0 200 200" role="img" aria-label={`${kind} product illustration`}>
        <title>{kind} product illustration</title>
        {kind === 'tote' || kind === 'badge' ? (
          <>
            <path d="M58 67h84l9 101H49z" fill="#E2E8F0" stroke="#64748B" strokeWidth="2" />
            <path d="M77 68V48a23 23 0 0 1 46 0v20" fill="none" stroke="#334155" strokeWidth="5" />
          </>
        ) : (
          <>
            <path
              d={
                kind === 'hoodie'
                  ? 'M72 37q28-28 56 0l29 16 26 60-25 12-18-36v85H60V89l-18 36-25-12 26-60z'
                  : 'M69 43l31 10 31-10 40 24-18 34-22-12v85H69V89l-22 12-18-34z'
              }
              fill="#1E293B"
              stroke="#334155"
              strokeWidth="2"
            />
            {kind === 'hoodie' && (
              <>
                <path d="M72 37q28 47 56 0" fill="#334155" stroke="#64748B" strokeWidth="2" />
                <path d="M79 128h42l7 28H72z" fill="#334155" />
                <path d="M90 66v30m20-30v30" stroke="#CBD5E1" strokeWidth="2" />
              </>
            )}
          </>
        )}
        <circle
          cx="100"
          cy={kind === 'tote' || kind === 'badge' ? 111 : 110}
          r="16"
          fill="#0F172A"
          stroke="#0EA5E9"
          strokeWidth="1.5"
        />
        <image
          href="/images/clubsphere-logo.png"
          x="87"
          y={kind === 'tote' || kind === 'badge' ? 98 : 97}
          width="26"
          height="26"
          preserveAspectRatio="xMidYMid meet"
        />
      </svg>
    </div>
  );
}
