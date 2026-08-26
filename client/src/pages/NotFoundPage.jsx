import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="container-shell flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="section-eyebrow">404</span>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        This page doesn't exist
      </h1>
      <p className="mt-3 max-w-md text-mist-300">
        The page you're looking for may have moved. Head back to the homepage
        to keep going.
      </p>
      <Link to="/" className="btn-primary mt-8">
        Back to home
      </Link>
    </div>
  );
}

export default NotFoundPage;
