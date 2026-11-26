import '@fontsource/pt-sans/latin-400.css';
import '@fontsource/pt-sans/latin-700.css';
import '@fontsource/barlow-condensed/latin-600.css';
import { EvidenceSearch } from './search-client';

export const metadata = { title: 'Evidence Search | DebateOS', description: 'Search source-linked debate evidence.' };

export default function ArgumentsPage() {
  return <EvidenceSearch />;
}
