import Header from '../Header';

export default function HeaderExample() {
  return (
    <div className="space-y-4">
      {/* Authenticated User */}
      <Header userTier="HomeHERO" isAuthenticated={true} />
      
      {/* Non-authenticated User */}
      <Header isAuthenticated={false} />
    </div>
  );
}