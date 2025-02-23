import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerOverlay,
} from "@/components/ui/drawer";
import { FileUploader } from "@/components/FileUploader";
import { Label } from "@/components/ui/label";
import { Upload, Download, Expand, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { IArchivo, IProducto } from "shared/interfaces";
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
import { useAuthStore } from "@/store/auth.store";
import { isSuperAdmin } from "shared/helpers";
import { useProductosStore } from "@/store/productos.store";
import { useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface ProductoGaleriaDrawerProps {
  open: boolean;
  producto: IProducto | null;
  onClose: () => void;
}

export const ProductoGaleriaDrawer = ({
  open,
  producto,
  onClose,
}: ProductoGaleriaDrawerProps) => {
  const { user } = useAuthStore();
  const isAdmin = isSuperAdmin(user);
  const { getProducto, loading, agregarItemGaleria, eliminarItemGaleria } =
    useProductosStore();
  const productoId = producto?.id;

  useEffect(() => {
    if (productoId) {
      getProducto(productoId);
    }
  }, [getProducto, productoId]);

  if (!producto) return null;

  const handleDownloadAll = async () => {
    if (!producto.galeria?.length) {
      toast.error("No hay archivos para descargar");
      return;
    }

    toast.promise(
      (async () => {
        const zip = new JSZip();

        // Agregar la portada si existe
        if (producto.portada?.url) {
          const portadaResponse = await fetch(producto.portada.url);
          const portadaBlob = await portadaResponse.blob();
          zip.file(
            `portada_${producto.portada.nombre || "portada.jpg"}`,
            portadaBlob
          );
        }

        // Agregar archivos de la galería
        for (const media of producto.galeria) {
          if (!media.url) continue;
          const response = await fetch(media.url);
          const blob = await response.blob();
          zip.file(media.nombre || `archivo_${media.id}.${media.tipo}`, blob);
        }

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${producto.sku}_galeria.zip`);
      })(),
      {
        loading: "Preparando archivo ZIP...",
        success: "Archivos descargados correctamente",
        error: "Error al descargar los archivos",
      }
    );
  };

  const handleUpdateMedia = async (
    file: File,
    fileKey: string,
    isPortada = false
  ) => {
    if (!producto) return;

    try {
      await agregarItemGaleria(producto, file, fileKey, isPortada);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleDeleteMedia = async (productoId: string, mediaId: string) => {
    if (!mediaId) {
      toast.error("No se puede eliminar el archivo");
      return;
    }

    try {
      await eliminarItemGaleria(productoId, mediaId);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerOverlay className="bg-black/20 backdrop-blur-sm" />
      <DrawerContent className="max-w-4xl mx-auto">
        <div className="relative">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <span className="font-mono text-muted-foreground">
                {producto.sku}
              </span>
              <span>{producto.nombre}</span>
            </DrawerTitle>
            <DrawerDescription>{producto.modelo}</DrawerDescription>

            <div className="space-y-6 pt-4">
              {/* Portada Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Imagen Principal</Label>
                  {isAdmin && (
                    <FileUploader
                      maxFiles={1}
                      folder={`productos/${producto.sku}/portada`}
                      onSuccess={({ file, fileKey }) => {
                        toast.promise(handleUpdateMedia(file, fileKey, true), {
                          loading: "Actualizando portada...",
                          success: "Portada actualizada correctamente",
                          error: "Error al actualizar la portada",
                        });
                      }}
                      onFailure={({ file }) => {
                        toast.error(`Error al cargar ${file.name}`);
                      }}
                    >
                      <Button variant="outline" size="sm">
                        Actualizar Portada
                      </Button>
                    </FileUploader>
                  )}
                </div>

                <div className="mx-auto w-full max-w-[300px] aspect-square relative group rounded-lg overflow-hidden border border-border">
                  <img
                    src={
                      producto.portada?.url ||
                      "https://api.dicebear.com/7.x/shapes/svg?size=400"
                    }
                    alt={producto.nombre}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          window.open(producto.portada?.url, "_blank")
                        }
                        title="Ver imagen completa"
                      >
                        <Expand className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                        title="Descargar imagen"
                      >
                        <a
                          href={producto.portada?.url}
                          download={producto.portada?.nombre || "portada"}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>

                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              title="Eliminar portada"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ¿Confirmar eliminación?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. La imagen de
                                portada será eliminada permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  if (!producto.portada?.id) {
                                    toast.error("No hay portada para eliminar");
                                    return;
                                  }

                                  toast.promise(
                                    handleDeleteMedia(
                                      producto.id,
                                      producto.portada.id
                                    ),
                                    {
                                      loading: "Eliminando portada...",
                                      success:
                                        "Portada eliminada correctamente",
                                      error: "Error al eliminar la portada",
                                    }
                                  );
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Galería Section */}
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Galería de Medios</Label>
                    {producto.galeria?.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadAll}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Descargar Todo
                      </Button>
                    )}
                  </div>

                  <div className="max-h-[calc(2*240px)] overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                      {producto.galeria?.map((media: IArchivo) => (
                        <div
                          key={media.id}
                          className="relative group rounded-lg overflow-hidden border border-border aspect-square"
                        >
                          {media.tipo.includes("video") ||
                          media.tipo.includes("mp4") ? (
                            <video
                              src={media.url}
                              controls
                              preload="metadata"
                              className="w-full h-full object-cover"
                            >
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <img
                              src={media.url}
                              alt={media.nombre}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(media.url, "_blank")}
                                title="Ver imagen completa"
                              >
                                <Expand className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8"
                                asChild
                                title="Descargar imagen"
                              >
                                <a
                                  href={media.url}
                                  download={media.nombre || "imagen"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>

                              {isAdmin && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="h-8 w-8"
                                      title="Eliminar imagen"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        ¿Confirmar eliminación?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción no se puede deshacer. El
                                        archivo será eliminado permanentemente
                                        de la galería.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancelar
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          toast.promise(
                                            handleDeleteMedia(
                                              producto.id,
                                              media.id
                                            ),
                                            {
                                              loading: "Eliminando archivo...",
                                              success:
                                                "Archivo eliminado correctamente",
                                              error:
                                                "Error al eliminar el archivo",
                                            }
                                          );
                                        }}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Drag and Drop Zone - Only for admins */}
                  {isAdmin && (
                    <FileUploader
                      folder={`productos/${producto.sku}/galeria`}
                      onSuccess={({ file, fileKey }) => {
                        toast.promise(handleUpdateMedia(file, fileKey), {
                          loading: "Agregando archivo a la galería...",
                          success: "Archivo agregado correctamente",
                          error: "Error al agregar el archivo",
                        });
                      }}
                      onFailure={({ file }) => {
                        toast.error(`Error al cargar ${file.name}`);
                      }}
                    >
                      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center transition-all duration-200 hover:border-primary hover:bg-primary/5">
                        <div className="flex flex-col items-center gap-3">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">
                              Arrastra y suelta archivos aquí
                            </p>
                            <p className="text-xs text-muted-foreground">
                              o{" "}
                              <span className="text-primary">
                                selecciona desde tu dispositivo
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </FileUploader>
                  )}
                </div>
              )}
            </div>
          </DrawerHeader>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button
                variant="outline"
                onClick={onClose}
                className="transition-all duration-200 hover:bg-secondary"
              >
                Cerrar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
