import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { EntidadesProtegidas } from "shared/enums";
import { IPrivilegio } from "shared/interfaces";
import { useRolesStore } from "@/store/roles.store";
import { useCallback, useEffect } from "react";

export default function RolesPage() {
  const { roles, listarRoles, actualizarRol } = useRolesStore();

  const handlePrivilegeChange = useCallback(
    (
      roleId: string,
      entidad: EntidadesProtegidas,
      privilegeKey: keyof IPrivilegio,
      value: boolean
    ) => {
      console.log("Updating privilege:", roleId, entidad, privilegeKey, value);
      const role = roles.find((role) => role.id === roleId);
      if (!role) return;
      const privilege = role.privilegios.find(
        (privilege) => privilege.entidad === entidad
      );
      if (!privilege) return;
      actualizarRol({
        ...role,
        privilegios: role.privilegios.map((p) =>
          p.entidad === entidad ? { ...p, [privilegeKey]: value } : p
        ),
      });
      toast({
        title: "Privilegio actualizado",
        content: `El privilegio de ${entidad} ha sido ${
          value ? "habilitado" : "deshabilitado"
        } para el rol ${role.nombre}`,
      });
    },
    [actualizarRol, roles]
  );

  useEffect(() => {
    listarRoles();
  }, [listarRoles]);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="space-y-8">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <CardTitle>{role.nombre}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Entidad</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Crear</TableHead>
                    <TableHead>Leer</TableHead>
                    <TableHead>Actualizar</TableHead>
                    <TableHead>Eliminar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {role.privilegios.map((privilege) => (
                    <TableRow key={privilege.id}>
                      <TableCell className="font-medium">
                        {privilege.entidad}
                      </TableCell>
                      {["admin", "crear", "leer", "actualizar", "eliminar"].map(
                        (action) => (
                          <TableCell key={action} className="text-center">
                            <Checkbox
                              checked={
                                privilege[
                                  action as keyof IPrivilegio
                                ] as boolean
                              }
                              onCheckedChange={(checked) =>
                                handlePrivilegeChange(
                                  role.id,
                                  privilege.entidad as EntidadesProtegidas,
                                  action as keyof IPrivilegio,
                                  checked as boolean
                                )
                              }
                            />
                          </TableCell>
                        )
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
