
import { useState, type FormEvent } from "react";

export interface FilterValues {
  category: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
}

interface ProductFiltersProps {
  initialValues: FilterValues;
  onApply: (values: FilterValues) => void;
  onClear: () => void;
}

export default function ProductFilters({
  initialValues,
  onApply,
  onClear,
}: ProductFiltersProps) {
  const [values, setValues] = useState(initialValues);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const minimum = values.minPrice === ""
      ? null : Number(values.minPrice);

    const maximum = values.maxPrice === ""
      ? null : Number(values.maxPrice);

    if (
      (minimum !== null && minimum < 0) ||
      (maximum !== null && maximum < 0) ||
      (minimum !== null && maximum !== null && minimum > maximum)
    ) {
      return;
    }

    onApply(values);
  }

  return (
    <form onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-5"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Filters
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
          Category
          <select
            value={values.category}
            onChange={(event) =>
              setValues({ ...values, category: event.target.value })
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2"
          >
            <option value="">All categories</option>

            <optgroup label="Electronics">
              <option value="Laptops">Laptops</option>
              <option value="Smartphones">Smartphones</option>
              <option value="Accessories">Accessories</option>
            </optgroup>

            <optgroup label="Clothing">
              <option value="T-Shirts">T-Shirts</option>
              <option value="Jeans">Jeans</option>
              <option value="Jackets">Jackets</option>
            </optgroup>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
          Minimum price
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.minPrice}
            onChange={(event) =>
              setValues({ ...values, minPrice: event.target.value })
            }
            placeholder="0.00"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
          Maximum price
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.maxPrice}
            onChange={(event) =>
              setValues({ ...values, maxPrice: event.target.value })
            }
            placeholder="Any"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
          Sort by
          <select
            value={values.sort}
            onChange={(event) =>
              setValues({ ...values, sort: event.target.value })
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2"
          >
            <option value="name,asc">Name: A–Z</option>
            <option value="name,desc">Name: Z–A</option>
            <option value="price,asc">Price: Low to High</option>
            <option value="price,desc">Price: High to Low</option>
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-lg bg-violet-700 px-5 py-2 font-medium text-white hover:bg-violet-800"
        >
          Apply filters
        </button>

        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50"
        >
          Clear all
        </button>
      </div>
    </form>
  );
}
