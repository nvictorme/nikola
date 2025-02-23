import { useLocation, useNavigate } from "react-router-dom";
import { useProductsStore } from "@/store/products.store";
import { Spinner } from "@/components/Spinner";
import { useCallback, useEffect, useState } from "react";
import { IArchivo, IProducto } from "shared/dist/interfaces";
import { replaceUuidWithSlug } from "../../../shared/src/helpers";

export default function ProductPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { product, products, setProduct } = useProductsStore();
  const [mainImage, setMainImage] = useState<IArchivo | undefined>(
    product?.portada
  );
  const productIndex = products.findIndex((p) => p.id === product?.id);
  const relatedProducts = products.slice(productIndex, productIndex + 8);

  const onRelatedProductClick = useCallback(
    (product: IProducto) => {
      setProduct(product);
      navigate(`/products/${product.id}`);
    },
    [setProduct, navigate]
  );

  useEffect(() => {
    if (product) {
      // replace the path with the product slug
      const currentPath = window.location.pathname;
      const slug = product.slug;
      const newPath = replaceUuidWithSlug(currentPath, slug);
      // Update the browser's URL without reloading the page
      window.history.replaceState({ path: newPath }, "", newPath);
      setMainImage(product.portada);
    }
    // Scroll to top when navigating to a new product
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname, product]);

  if (!product) {
    return <Spinner />;
  }
  return (
    <div className="grid md:grid-cols-2 gap-6 lg:gap-12 items-start max-w-full px-4 mx-auto py-6">
      <div className="grid md:grid-cols-5 gap-3 items-start">
        <div className="flex md:hidden items-start">
          <div className="grid gap-4">
            <h1 className="font-bold text-2xl sm:text-3xl">{product.nombre}</h1>
            <div>
              <p className="text-sm md:text-base">{product.descripcion}</p>
            </div>
            <div className="grid gap-1">
              <div>
                <span className="font-medium">Category:</span>{" "}
                {product.categoria.name}
              </div>
              {product.subcategoria && (
                <div>
                  <span className="font-medium">Subcategory:</span>{" "}
                  {product.subcategoria.name}
                </div>
              )}
              <div>
                <span className="font-medium">Dimensions:</span>{" "}
                {product.dimensiones?.largo} x {product.dimensiones?.ancho} x{" "}
                {product.dimensiones?.alto}{" "}
                {product.dimensiones?.unidadLongitud}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-4">
          <img
            src={mainImage?.url || "/placeholder.svg"}
            alt={product.nombre}
            width={400}
            height={400}
            className="aspect-square object-cover border w-full max-w-[400px] rounded-lg overflow-hidden"
          />
        </div>
      </div>
      <div className="grid gap-4 md:gap-10 items-start">
        <div className="hidden md:flex items-start">
          <div className="grid gap-4">
            <h1 className="font-bold text-xl lg:text-2xl">{product.nombre}</h1>
            <div>
              <p className="text-sm md:text-base">{product.descripcion}</p>
            </div>
            <div className="grid gap-1">
              <div>
                <span className="font-medium">Category:</span>{" "}
                {product.categoria.name}
              </div>
              {product.subcategoria && (
                <div>
                  <span className="font-medium">Subcategory:</span>{" "}
                  {product.subcategoria.name}
                </div>
              )}
              <div>
                <span className="font-medium">Dimensions:</span>{" "}
                {product.dimensiones?.largo} x {product.dimensiones.ancho} x{" "}
                {product.dimensiones?.alto}{" "}
                {product.dimensiones?.unidadLongitud}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 overflow-x-auto my-2">
        <h2 className="font-bold text-lg">Gallery</h2>
        <div className="flex flex-row gap-2">
          <button
            onClick={() => setMainImage(product.portada)}
            className="border hover:border-primary rounded-lg transition-colors min-w-[100px] flex-shrink-0"
          >
            <img
              src={product.portada?.url || "/placeholder.svg"}
              alt={product.nombre}
              width={100}
              height={100}
              className="aspect-square object-cover max-w-[400px]"
            />
            <span className="sr-only">
              View image {product.portada?.nombre}
            </span>
          </button>
          {product.galeria?.map((img) => (
            <button
              key={img.id}
              onClick={() => setMainImage(img)}
              className="border hover:border-primary rounded-lg transition-colors min-w-[100px] flex-shrink-0"
            >
              {img.tipo.includes("mp") ? null : (
                <img
                  src={img.url || "/placeholder.svg"}
                  alt={img.nombre}
                  width={100}
                  height={100}
                  className="aspect-square object-cover max-w-[400px]"
                />
              )}
              <span className="sr-only">View image {img.nombre}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="col-span-2">
        <h2 className="font-bold text-2xl mb-4">Related Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {relatedProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => onRelatedProductClick(p)}
              className="relative overflow-hidden transition-transform duration-300 ease-in-out rounded-lg shadow-lg group hover:shadow-xl hover:-translate-y-2"
            >
              <img
                src={p.portada?.url || "/placeholder.svg"}
                alt={p.nombre}
                width={300}
                height={300}
                className="object-cover w-full h-64"
                style={{ aspectRatio: "300/300", objectFit: "cover" }}
              />
              <div className="p-4 bg-background">
                <h3 className="text-l">{p.nombre}</h3>
                <p className="text-sm text-muted-foreground">
                  {p.modelo} / {p.categoria.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
