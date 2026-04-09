import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import FrameList from './components/FrameList';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <ImageUploader />
        <FrameList />
      </main>
    </div>
  );
}
