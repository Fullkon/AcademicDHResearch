import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { Dashboard } from '@/components/Dashboard/Dashboard';
import { ResearchTopicForm } from '@/components/ResearchTopic/ResearchTopicForm';
import { LiteratureSearch } from '@/components/Literature/LiteratureSearch';
import { CorpusSearch } from '@/components/Corpus/CorpusSearch';
import { DatasetManager } from '@/components/Dataset/DatasetManager';
import { ExperimentDesign } from '@/components/Experiment/ExperimentDesign';
import { ResultsAnalysis } from '@/components/Results/ResultsAnalysis';
import { MapSearch } from '@/components/Statistics/MapSearch';
import { YearbookSearch } from '@/components/Statistics/YearbookSearch';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="research-topic" element={<ResearchTopicForm />} />
          <Route path="literature" element={<LiteratureSearch />} />
          <Route path="corpus" element={<CorpusSearch />} />
          <Route path="dataset" element={<DatasetManager />} />
          <Route path="experiment" element={<ExperimentDesign />} />
          <Route path="results" element={<ResultsAnalysis />} />
          <Route path="map" element={<MapSearch />} />
          <Route path="statistics" element={<YearbookSearch />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
