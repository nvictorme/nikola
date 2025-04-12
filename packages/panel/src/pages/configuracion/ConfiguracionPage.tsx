import FactoresCard from "./FactoresCard";

const ConfiguracionPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FactoresCard />
        {/* Add more cards here in the future */}
      </div>
    </div>
  );
};

export default ConfiguracionPage;
