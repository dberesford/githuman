import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HighlighterProvider } from './contexts/HighlighterContext';
import { HomePage } from './pages/HomePage';
import { ReviewPage } from './pages/ReviewPage';
import { StagedChangesPage } from './pages/StagedChangesPage';
import { NewReviewPage } from './pages/NewReviewPage';

export function App() {
  return (
    <HighlighterProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="new" element={<NewReviewPage />} />
          <Route path="staged" element={<StagedChangesPage />} />
          <Route path="reviews/:id" element={<ReviewPage />} />
        </Route>
      </Routes>
    </HighlighterProvider>
  );
}
