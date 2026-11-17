
import { useState, type FormEvent } from "react";

interface ProductSearchProps {
  initialValue: string;
  onSearch: (value: string) => void;
}

export default function ProductSearch({
  initialValue,
  onSearch,
}: ProductSearchProps) {
  const [query, setQuery] = useState(initialValue);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(query.trim());
  }

  return (
    <form onSubmit={handleSubmit} role="search"
      className="flex flex-col gap-2 sm:flex-row"
    >
      <label htmlFor="product-search" className="sr-only">
        Search products
      </label>

      <input
        id="product-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search for products..."
        className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:outline-2 focus:outline-violet-600"
      />

      <button
        type="submit"
        className="rounded-lg bg-violet-700 px-6 py-3 font-semibold text-white hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
      >
        Search
      </button>
    </form>
  );
}
