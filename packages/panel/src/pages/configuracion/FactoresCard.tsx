import { useConfiguracionStore } from "@/store/configuracion.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IFactores } from "shared/interfaces";
import { TipoCliente, TipoCambio } from "shared/enums";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";

const FactoresCard: React.FC = () => {
  const { factores, fetchFactores, actualizarFactores } =
    useConfiguracionStore();

  useEffect(() => {
    fetchFactores();
  }, [fetchFactores]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nuevoFactores = { ...factores };
    nuevoFactores[name as keyof IFactores] = parseFloat(value);
    actualizarFactores(nuevoFactores);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Factores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Factores por Tipo de Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor={TipoCliente.instalador}>Instalador</Label>
              <Input
                id={TipoCliente.instalador}
                name={TipoCliente.instalador}
                type="number"
                step="0.01"
                value={factores[TipoCliente.instalador]}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={TipoCliente.mayorista}>Mayorista</Label>
              <Input
                id={TipoCliente.mayorista}
                name={TipoCliente.mayorista}
                type="number"
                step="0.01"
                value={factores[TipoCliente.mayorista]}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={TipoCliente.general}>General</Label>
              <Input
                id={TipoCliente.general}
                name={TipoCliente.general}
                type="number"
                step="0.01"
                value={factores[TipoCliente.general]}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Factores por Tipo de Cambio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={TipoCambio.usd}>USD</Label>
              <Input
                id={TipoCambio.usd}
                name={TipoCambio.usd}
                type="number"
                step="0.01"
                value={factores[TipoCambio.usd]}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={TipoCambio.bcv}>BCV</Label>
              <Input
                id={TipoCambio.bcv}
                name={TipoCambio.bcv}
                type="number"
                step="0.01"
                value={factores[TipoCambio.bcv]}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FactoresCard;
