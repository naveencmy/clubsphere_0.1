export default function ProductArt({ kind = 'hoodie' }) {
  return (
    <div className="product-art">
      <svg viewBox="0 0 200 200" role="img" aria-label={`${kind} product illustration`}>
        <title>{kind} product illustration</title>
        {kind === 'tote' ? (
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
          cy={kind === 'tote' ? 111 : 110}
          r="14"
          fill="none"
          stroke={kind === 'tote' ? '#334155' : '#E2E8F0'}
          strokeWidth="1.5"
        />
        <text
          x="100"
          y={kind === 'tote' ? 115 : 114}
          textAnchor="middle"
          fill={kind === 'tote' ? '#334155' : '#E2E8F0'}
          fontFamily="sans-serif"
          fontSize="9"
          fontWeight="600"
        >
          SKY
        </text>
      </svg>
    </div>
  );
}
