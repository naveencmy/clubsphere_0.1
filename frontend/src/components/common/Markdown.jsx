import { Fragment } from 'react';

// A deliberately small Markdown dialect. React escapes text; raw HTML is never parsed.
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g).map((part, i) => {
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`'))
      return (
        <code className="mono" key={i}>
          {part.slice(1, -1)}
        </code>
      );
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    return link ? (
      <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer">
        {link[1]}
      </a>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    );
  });
}
export default function Markdown({ content = '' }) {
  return (
    <div className="markdown stack small">
      {content
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((block, i) => {
          if (/^#{1,3} /.test(block))
            return <h3 key={i}>{inline(block.replace(/^#{1,3} /, ''))}</h3>;
          if (block.split('\n').every((line) => /^[-*] /.test(line)))
            return (
              <ul key={i}>
                {block.split('\n').map((line, j) => (
                  <li key={j}>{inline(line.slice(2))}</li>
                ))}
              </ul>
            );
          return (
            <p key={i}>
              {block.split('\n').map((line, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  {inline(line)}
                </Fragment>
              ))}
            </p>
          );
        })}
    </div>
  );
}
