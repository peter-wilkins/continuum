import type { PublicContinuumResponse } from '@continuum/shared';

type PublicSourceParagraph = PublicContinuumResponse['sourceParagraphs'][number];
type PublicEventById = Map<string, PublicContinuumResponse['events'][number]>;

export function PublicSourceLinks({
  eventsById,
  sourceParagraphs,
}: {
  eventsById: PublicEventById;
  sourceParagraphs: PublicSourceParagraph[];
}) {
  return (
    <footer className="public-thought-provenance">
      {sourceParagraphs.map((paragraph) => {
        const event = eventsById.get(paragraph.canonicalEventId);

        return (
          <a
            href={paragraph.sourceUrl}
            key={paragraph.id}
            target="_blank"
            rel="noreferrer"
            title={event?.subject ?? paragraph.title}
          >
            {sourceLabel(paragraph)}
          </a>
        );
      })}
    </footer>
  );
}

export function sourceLabel(paragraph: PublicSourceParagraph): string {
  return `${paragraph.sourceName} / ${paragraph.title} / paragraph ${paragraph.paragraphIndex + 1}`;
}
