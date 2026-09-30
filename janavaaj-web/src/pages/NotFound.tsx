import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <p className="text-7xl font-black text-primary-soft">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <Link to="/" className="mt-6">
        <Button leftIcon={<Home className="h-4 w-4" />}>Back to home</Button>
      </Link>
    </div>
  );
}
