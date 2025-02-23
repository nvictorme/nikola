import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCountryStore } from "@/store/country.store";

export default function CountriesPage() {
  const navigate = useNavigate();
  const { countries, loading, error, setSelectedCountry, fetchCountries } =
    useCountryStore();

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const handleCountrySelect = (country: (typeof countries)[0]) => {
    setSelectedCountry(country);
    navigate("/home");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <main className="flex-1">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Select Your Country
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              Choose your location to see relevant content and products
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {countries.map((country) => (
              <button
                key={country.id}
                onClick={() => handleCountrySelect(country)}
                className="flex flex-col items-center p-4 space-y-2 rounded-lg hover:bg-accent transition-colors"
              >
                <img
                  src={`https://flagcdn.com/w160/${country.iso2.toLowerCase()}.png`}
                  alt={`${country.name} flag`}
                  className="w-20 h-auto rounded shadow-sm"
                />
                <span className="text-sm font-medium text-center">
                  {country.nombre}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
