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
import ProductoDetails from "./ProductoDetails";
import { Checkbox } from "@/components/ui/checkbox";
import ProductoStockModal from "./ProductoStockModal";
import { routes } from "@/navigation/routes";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { columnasProductos, Producto } from "./columnas.productos";
import { useDebounce } from "@/hooks/useDebounce";
import { ProductoGaleriaDrawer } from "./ProductoGaleriaDrawer";

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
    categoria,
    enOferta,
    setTerm,
    setCategoria,
    setEnOferta,
    setShowGallery,
    showGallery,
    setShowDetails,
    showDetails,
    setShowStockModal,
    showStockModal,
  } = useProductosStore();

  const { categorias, listarCategorias } = useCategoriasStore();

  const [searchTerm, setSearchTerm] = useState<string>(term || "");
  const debouncedSearchTerm = useDebounce(searchTerm);

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

          <div className="flex flex-col justify-end h-[60px]">
            <div className="flex items-center gap-2 h-[40px]">
              <Checkbox
                id="offers"
                disabled={isAdmin}
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
