import { DataTable } from "@/components/DataTable";
import { usePaisesStore } from "@/store/paises.store";
import { useEffect, useState } from "react";
import { columnasPaises, Pais } from "./columnas.paises";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { IPais } from "shared/interfaces";

const PaisForm = ({
  pais,
  onSuccess,
}: {
  pais?: Pais | null;
  onSuccess: () => void;
}) => {
  const { crearPais, actualizarPais, isLoading } = usePaisesStore();
  const [formData, setFormData] = useState({
    nombre: "",
    name: "",
    iso2: "",
    iso3: "",
    phoneCode: "",
  });

  useEffect(() => {
    if (pais) {
      setFormData({
        nombre: pais.nombre,
        name: pais.name,
        iso2: pais.iso2,
        iso3: pais.iso3,
        phoneCode: pais.phoneCode,
      });
    } else {
      setFormData({
        nombre: "",
        name: "",
        iso2: "",
        iso3: "",
        phoneCode: "",
      });
    }
  }, [pais]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate ISO codes
    const iso2Regex = /^[A-Z]{2}$/;
    const iso3Regex = /^[A-Z]{3}$/;
    const phoneCodeRegex = /^\+?\d{1,4}$/;

    if (!iso2Regex.test(formData.iso2.toUpperCase())) {
      return;
    }

    if (!iso3Regex.test(formData.iso3.toUpperCase())) {
      return;
    }

    if (!phoneCodeRegex.test(formData.phoneCode)) {
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        iso2: formData.iso2.toUpperCase(),
        iso3: formData.iso3.toUpperCase(),
      };

      if (pais) {
        await actualizarPais({ ...pais, ...dataToSubmit } as IPais);
      } else {
        await crearPais(dataToSubmit as IPais);
      }
      onSuccess();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <Input
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Nombre en inglés
        </label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Código ISO 2</label>
        <Input
          value={formData.iso2}
          onChange={(e) => setFormData({ ...formData, iso2: e.target.value })}
          required
          maxLength={2}
          className="uppercase"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Código ISO 3</label>
        <Input
          value={formData.iso3}
          onChange={(e) => setFormData({ ...formData, iso3: e.target.value })}
          required
          maxLength={3}
          className="uppercase"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Código de teléfono
        </label>
        <Input
          value={formData.phoneCode}
          onChange={(e) =>
            setFormData({ ...formData, phoneCode: e.target.value })
          }
          required
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {pais ? "Actualizar" : "Crear"}
      </Button>
    </form>
  );
};

const PaisesPage: React.FC = () => {
  const {
    paises,
    listarPaises,
    page,
    limit,
    pageCount,
    setPage,
    setLimit,
    error,
  } = usePaisesStore();
  const [open, setOpen] = useState(false);
  const [selectedPais, setSelectedPais] = useState<Pais | null>(null);

  useEffect(() => {
    listarPaises();
  }, [listarPaises]);

  const handleEdit = (pais: Pais) => {
    setSelectedPais(pais);
    setOpen(true);
  };

  const handleClose = () => {
    setSelectedPais(null);
    setOpen(false);
  };

  const handleNew = () => {
    setSelectedPais(null);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Países</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo País
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedPais ? "Editar País" : "Nuevo País"}
              </DialogTitle>
            </DialogHeader>
            <PaisForm pais={selectedPais} onSuccess={handleClose} />
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <DataTable
        columns={columnasPaises({ handleEdit })}
        data={paises}
        page={page}
        pageCount={pageCount}
        limit={limit}
        setPage={setPage}
        setLimit={setLimit}
        hideFilter={true}
      />
    </div>
  );
};

export default PaisesPage;
