import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { IProducto } from "../../../shared/src/interfaces";
import { Categorias } from "../../../shared/src/enums";
import { useProductsStore } from "@/store/products.store";

export default function CataloguePage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { products, fetchProducts, setProduct } = useProductsStore();
  const filteredProducts: IProducto[] =
    selectedCategory === "all"
      ? products
      : products.filter(
          (product) => product.categoria.nombre === selectedCategory
        );

  const handleProductClick = useCallback(
    (product: IProducto) => {
      setProduct(product);
      navigate(`/products/${product.id}`);
    },
    [navigate, setProduct]
  );
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  return (
    <main className="flex-1">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Inflalo Product Catalogue
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Browse through our extensive catalogue of inflatables and bouncy
                castles to find the perfect solution for your event.
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
              >
                All
              </Button>
              <Button
                variant={
                  selectedCategory === Categorias.diversion
                    ? "default"
                    : "outline"
                }
                onClick={() => setSelectedCategory(Categorias.diversion)}
              >
                Fun Inflatables
              </Button>
              <Button
                variant={
                  selectedCategory === Categorias.publicitarios
                    ? "default"
                    : "outline"
                }
                onClick={() => setSelectedCategory(Categorias.publicitarios)}
              >
                Advertising
              </Button>
              <Button
                variant={
                  selectedCategory === Categorias.motores
                    ? "default"
                    : "outline"
                }
                onClick={() => setSelectedCategory(Categorias.motores)}
              >
                Blowers
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="relative group overflow-hidden rounded-lg cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <img
                  src={product.portada?.url || "/placeholder.svg"}
                  width={400}
                  height={300}
                  alt={product.nombre}
                  className="w-full aspect-[4/3] object-cover group-hover:opacity-50 transition-opacity"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/40 to-transparent p-6 text-white group-hover:opacity-100 transition-opacity">
                  <h3 className="text-xl font-bold">{product.nombre}</h3>
                  <p className="text-sm">{product.categoria.name}</p>
                  <p className="text-sm">SKU: {product.sku}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
