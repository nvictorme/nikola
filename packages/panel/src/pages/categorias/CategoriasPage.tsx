/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useCategoriasStore } from "../../store/categorias.store";
import { ICategoria, ISubcategoria } from "shared/interfaces";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function CategoriasPage() {
  const { toast } = useToast();
  const [newItemForm, setNewItemForm] = useState({ nombre: "" });
  const [isAddingCategoria, setIsAddingCategoria] = useState(false);
  const [isAddingSubcategoria, setIsAddingSubcategoria] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<
    ICategoria | ISubcategoria | null
  >(null);
  const [editForm, setEditForm] = useState({ nombre: "" });

  const {
    categorias,
    categoria,
    subcategorias,
    listarCategorias,
    listarSubcategorias,
    crearCategoria,
    actualizarCategoria,
    setCategoria,
    crearSubcategoria,
    actualizarSubcategoria,
  } = useCategoriasStore();

  useEffect(() => {
    listarCategorias();
  }, []);

  const handleCategoriaClick = async (cat: ICategoria) => {
    setCategoria(cat);
    await listarSubcategorias(cat.id);
  };

  const handleAddCategoria = async () => {
    try {
      await crearCategoria({
        nombre: newItemForm.nombre,
        activo: true,
      } as ICategoria);
      await listarCategorias();
      setIsAddingCategoria(false);
      setNewItemForm({ nombre: "" });
      toast({
        title: "Categoría creada",
        description: "La categoría se ha creado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo crear la categoría",
        variant: "destructive",
      });
    }
  };

  const handleAddSubcategoria = async () => {
    if (!categoria) return;

    try {
      await crearSubcategoria({
        nombre: newItemForm.nombre,
        activo: true,
        categoria,
      } as ISubcategoria);
      await listarSubcategorias(categoria.id);
      setIsAddingSubcategoria(false);
      setNewItemForm({ nombre: "" });
      toast({
        title: "Subcategoría creada",
        description: "La subcategoría se ha creado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo crear la subcategoría",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!editingItem) return;

    try {
      if ("subcategorias" in editingItem) {
        await actualizarCategoria({
          ...editingItem,
          nombre: editForm.nombre,
        } as ICategoria);
        await listarCategorias();
      } else {
        await actualizarSubcategoria({
          ...editingItem,
          nombre: editForm.nombre,
          categoria: categoria!,
        } as ISubcategoria);
        await listarSubcategorias(categoria!.id);
      }
      setIsEditing(false);
      setEditingItem(null);
      setEditForm({ nombre: "" });
      toast({
        title: "Actualizado",
        description: "El elemento se ha actualizado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo actualizar el elemento",
        variant: "destructive",
      });
    }
  };

  const startEdit = (item: ICategoria | ISubcategoria) => {
    setEditingItem(item);
    setEditForm({
      nombre: item.nombre,
    });
    setIsEditing(true);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Categorías</h1>
        <Dialog open={isAddingCategoria} onOpenChange={setIsAddingCategoria}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Nueva categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva categoría</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={newItemForm.nombre}
                  onChange={(e) =>
                    setNewItemForm((prev) => ({
                      ...prev,
                      nombre: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <Button onClick={handleAddCategoria}>Crear Categoría</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Categorías */}
        <Card>
          <CardHeader>
            <CardTitle>Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categorias.map((cat) => (
                <div
                  key={cat.id}
                  className={cn(
                    "flex items-start justify-between p-3 rounded-lg cursor-pointer hover:bg-accent",
                    categoria?.id === cat.id && "bg-accent"
                  )}
                  onClick={() => handleCategoriaClick(cat)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-left">{cat.nombre}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-4 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(cat);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subcategorías */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Subcategorías {categoria && `de ${categoria.nombre}`}
            </CardTitle>
            {categoria && (
              <Dialog
                open={isAddingSubcategoria}
                onOpenChange={setIsAddingSubcategoria}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Nueva subcategoría
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva subcategoría</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="subNombre">Nombre</Label>
                      <Input
                        id="subNombre"
                        value={newItemForm.nombre}
                        onChange={(e) =>
                          setNewItemForm((prev) => ({
                            ...prev,
                            nombre: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddSubcategoria}>
                    Crear subcategoría
                  </Button>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subcategorias.map((subcat) => (
                <div
                  key={subcat.id}
                  className="flex items-start justify-between p-3 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-left">{subcat.nombre}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-4 shrink-0"
                    onClick={() => startEdit(subcat)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Editar{" "}
              {editingItem
                ? "categoria" in editingItem
                  ? "Subcategoría"
                  : "Categoría"
                : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">
                Nombre de la{" "}
                {editingItem
                  ? "categoria" in editingItem
                    ? "subcategoría"
                    : "categoría"
                  : ""}
              </Label>
              <Input
                id="nombre"
                value={editForm.nombre}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, nombre: e.target.value }))
                }
              />
            </div>
          </div>
          <Button onClick={handleEdit}>Guardar cambios</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
