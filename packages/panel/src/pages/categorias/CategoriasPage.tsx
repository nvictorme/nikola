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
  const [newItemForm, setNewItemForm] = useState({ nombre: "", name: "" });
  const [isAddingCategoria, setIsAddingCategoria] = useState(false);
  const [isAddingSubcategoria, setIsAddingSubcategoria] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<
    ICategoria | ISubcategoria | null
  >(null);
  const [editForm, setEditForm] = useState({ nombre: "", name: "" });

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
        name: newItemForm.name,
        activo: true,
      } as ICategoria);
      await listarCategorias();
      setIsAddingCategoria(false);
      setNewItemForm({ nombre: "", name: "" });
      toast({
        title: "Categoría creada",
        description: "La categoría se ha creado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la categoría",
        variant: "destructive",
      });
    }
  };

  const handleAddSubcategoria = async () => {
    if (!categoria) return;

    try {
      await crearSubcategoria({
        nombre: newItemForm.nombre,
        name: newItemForm.name,
        activo: true,
        categoria,
      } as ISubcategoria);
      await listarSubcategorias(categoria.id);
      setIsAddingSubcategoria(false);
      setNewItemForm({ nombre: "", name: "" });
      toast({
        title: "Subcategoría creada",
        description: "La subcategoría se ha creado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la subcategoría",
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
          name: editForm.name,
        } as ICategoria);
        await listarCategorias();
      } else {
        await actualizarSubcategoria({
          ...editingItem,
          nombre: editForm.nombre,
          name: editForm.name,
          categoria: categoria!,
        } as ISubcategoria);
        await listarSubcategorias(categoria!.id);
      }
      setIsEditing(false);
      setEditingItem(null);
      setEditForm({ nombre: "", name: "" });
      toast({
        title: "Actualizado",
        description: "El elemento se ha actualizado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el elemento",
        variant: "destructive",
      });
    }
  };

  const startEdit = (item: ICategoria | ISubcategoria) => {
    setEditingItem(item);
    setEditForm({
      nombre: item.nombre,
      name: item.name,
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
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Categoría</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre (Español)</Label>
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
              <div className="grid gap-2">
                <Label htmlFor="name">Name (English)</Label>
                <Input
                  id="name"
                  value={newItemForm.name}
                  onChange={(e) =>
                    setNewItemForm((prev) => ({
                      ...prev,
                      name: e.target.value,
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
                    <p className="text-sm text-muted-foreground text-left">
                      {cat.name}
                    </p>
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
                    Nueva Subcategoría
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva Subcategoría</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="subNombre">Nombre (Español)</Label>
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
                    <div className="grid gap-2">
                      <Label htmlFor="subName">Name (English)</Label>
                      <Input
                        id="subName"
                        value={newItemForm.name}
                        onChange={(e) =>
                          setNewItemForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddSubcategoria}>
                    Crear Subcategoría
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
                    <p className="text-sm text-muted-foreground text-left">
                      {subcat.name}
                    </p>
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
              <Label htmlFor="nombre">Nombre (Español)</Label>
              <Input
                id="nombre"
                value={editForm.nombre}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, nombre: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name (English)</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
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
