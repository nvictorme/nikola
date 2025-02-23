import { useProductosStore } from "@/store/productos.store";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth.store";
import { isSuperAdmin } from "shared/helpers";
import { Spinner } from "@/components/Spinner";
import { useCategoriasStore } from "@/store/categorias.store";
import { usePaisesStore } from "@/store/paises.store";
import ProductoDetails from "./ProductoDetails";
import { Checkbox } from "@/components/ui/checkbox";
import ProductoStockModal from "./ProductoStockModal";
import { routes } from "@/navigation/routes";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { columnasProductos, Producto } from "./columnas.productos";
import { useDebounce } from "@/hooks/useDebounce";
import { ProductoGaleriaDrawer } from "./ProductoGaleriaDrawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";

const ProductosPage: React.FC = () => {
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const isAdmin = isSuperAdmin(user);

  const {
    productos,
    producto,
    loading: loadingProductos,
    listarProductos,
    setProducto,
    page,
    limit,
    pageCount,
    setPage,
    setLimit,
    term,
    pais,
    categoria,
    enOferta,
    setTerm,
    setCategoria,
    setPais,
    setEnOferta,
    setShowGallery,
    showGallery,
    setShowDetails,
    showDetails,
    setShowStockModal,
    showStockModal,
    copiarPrecios,
    copiandoPrecios,
  } = useProductosStore();

  const { categorias, listarCategorias } = useCategoriasStore();

  const { paises, listarTodosLosPaises } = usePaisesStore();

  const [searchTerm, setSearchTerm] = useState<string>(term || "");
  const debouncedSearchTerm = useDebounce(searchTerm);

  const [paisOrigen, setPaisOrigen] = useState<string>("");
  const [paisDestino, setPaisDestino] = useState<string>("");

  // Add effect to update search when debounced value changes
  useEffect(() => {
    setTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm, setTerm]);

  // listar categorias
  useEffect(() => {
    if (!categorias.length) {
      listarCategorias();
    }
  }, [categorias, listarCategorias]);

  // listar productos
  useEffect(() => {
    listarProductos();
  }, [listarProductos]);

  // listar paises
  useEffect(() => {
    listarTodosLosPaises();
  }, [listarTodosLosPaises]);

  const handleCopiarPrecios = async () => {
    if (!paisOrigen || !paisDestino) {
      toast.error("Seleccione país de origen y destino");
      return;
    }
    await copiarPrecios(paisOrigen, paisDestino);
    setPaisOrigen("");
    setPaisDestino("");
  };

  return (
    <div className="space-y-4">
      <header className="sticky top-16 z-50 flex flex-col gap-4 border-b bg-background px-4 py-4 md:px-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Label htmlFor="search" className="text-left block mb-2">
              Buscar
            </Label>
            <Input
              id="search"
              value={searchTerm}
              placeholder="Buscar productos por nombre, modelo, sku"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-[180px]">
            <Label htmlFor="categoria" className="text-left block mb-2">
              Categoría
            </Label>
            <Select
              defaultValue="Todos"
              value={categoria || "Todos"}
              onValueChange={(value) => {
                setCategoria(value === "Todos" ? null : (value as string));
              }}
            >
              <SelectTrigger id="categoria">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todas las categorías</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isAdmin && (
            <div className="w-[180px]">
              <Label htmlFor="pais" className="text-left block mb-2">
                País
              </Label>
              <Select
                defaultValue="Todos"
                value={pais || "Todos"}
                onValueChange={(value) => {
                  setPais(value === "Todos" ? null : (value as string));
                }}
              >
                <SelectTrigger id="pais">
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos los países</SelectItem>
                  {paises.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col justify-end h-[60px]">
            <div className="flex items-center gap-2 h-[40px]">
              <Checkbox
                id="offers"
                disabled={isAdmin && !pais}
                checked={enOferta}
                onCheckedChange={(checked) => {
                  setEnOferta(checked as boolean);
                }}
              />
              <label
                htmlFor="offers"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                En oferta
              </label>
            </div>
          </div>

          {isAdmin && (
            <div className="flex flex-col justify-end h-[60px]">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 h-[40px]">
                    {copiandoPrecios ? (
                      <>
                        <Spinner />
                        Copiando...
                      </>
                    ) : (
                      <>
                        <CopyIcon size={16} />
                        Copiar Precios
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Copiar Precios entre Países
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Seleccione el país de origen y destino para copiar los
                      precios de todos los productos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>País de Origen</Label>
                      <Select value={paisOrigen} onValueChange={setPaisOrigen}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione país origen" />
                        </SelectTrigger>
                        <SelectContent>
                          {paises.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>País de Destino</Label>
                      <Select
                        value={paisDestino}
                        onValueChange={setPaisDestino}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione país destino" />
                        </SelectTrigger>
                        <SelectContent>
                          {paises.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCopiarPrecios}
                      disabled={copiandoPrecios}
                    >
                      {copiandoPrecios ? (
                        <>
                          <Spinner />
                          Copiando...
                        </>
                      ) : (
                        "Copiar Precios"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {isAdmin ? (
            <div className="flex flex-col justify-end h-[60px]">
              <Button
                onClick={() => {
                  navigate(
                    routes.producto.path.replace(":productoId", "nuevo")
                  );
                }}
                className="gap-2 h-[40px]"
              >
                <PlusCircleIcon size={16} /> Producto
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      {loadingProductos ? (
        <div className="flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <DataTable
          columns={columnasProductos}
          data={productos as Producto[]}
          page={page}
          limit={limit}
          pageCount={pageCount}
          setPage={setPage}
          setLimit={setLimit}
          hideFilter
        />
      )}

      <ProductoGaleriaDrawer
        open={showGallery}
        producto={producto}
        onClose={() => {
          setShowGallery(false);
          setProducto(null);
        }}
      />
      <ProductoDetails
        open={showDetails}
        onClose={() => {
          setShowDetails(false);
          setProducto(null);
        }}
      />
      <ProductoStockModal
        open={showStockModal}
        onClose={() => {
          setShowStockModal(false);
          setProducto(null);
        }}
      />
    </div>
  );
};

export default ProductosPage;
