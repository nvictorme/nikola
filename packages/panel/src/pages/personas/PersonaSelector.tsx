import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { IPersona } from "shared/interfaces";
import { usePersonasStore } from "@/store/personas.store";
import { getInitials } from "shared/helpers";
import CreateButton from "@/components/CreateButton";
import PersonaForm from "./PersonaForm";
interface PersonaSelectorProps {
  onSelect: (persona: IPersona | null) => void;
}

export default function PersonaSelector({ onSelect }: PersonaSelectorProps) {
  const [selectedPersona, setSelectedPersona] = useState<IPersona | null>(null);

  const {
    personas,
    openSheet,
    showSheet,
    hideSheet,
    setPersona,
    listarPersonas,
    term,
    setTerm,
  } = usePersonasStore();

  useEffect(() => {
    listarPersonas();
  }, [listarPersonas]);

  const handleSelect = (persona: IPersona) => {
    setSelectedPersona(persona);
    onSelect(persona);
    setTerm("");
  };

  const handleClearSelection = () => {
    setSelectedPersona(null);
    onSelect(null);
  };

  const onOpenSheet = () => {
    setPersona(null);
    showSheet();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      {selectedPersona ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Cliente seleccionado
              <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage
                  src={selectedPersona.avatar}
                  alt={`${selectedPersona.nombre} ${selectedPersona.apellido}`}
                />
                <AvatarFallback>
                  {getInitials(
                    selectedPersona.nombre,
                    selectedPersona.apellido
                  )}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">
                  {selectedPersona.nombre} {selectedPersona.apellido}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPersona.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPersona.nif}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, empresa, NIF o email..."
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {!personas || personas.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-muted-foreground text-lg">
                No se hallaron clientes
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] border rounded-md p-4">
              {personas.map((persona) => (
                <div
                  key={persona.id}
                  className="flex items-center space-x-4 py-2 px-2 hover:bg-accent rounded-md cursor-pointer"
                  onClick={() => handleSelect(persona)}
                >
                  <Avatar>
                    <AvatarImage
                      src={persona.avatar}
                      alt={`${persona.nombre} ${persona.apellido}`}
                    />
                    <AvatarFallback>
                      {getInitials(persona.nombre, persona.apellido)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {persona.nombre} {persona.apellido}
                    </p>
                    {/*
                      Se ocultó el correo electrónico del cliente en la lista de selección
                      {persona.email}
                    */}
                    <p className="text-sm text-muted-foreground">
                      {persona.nif}
                    </p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          )}

          <div className="flex justify-center pt-4">
            <CreateButton
              title="Cliente"
              buttonText="Crear nuevo cliente"
              open={openSheet}
              onOpenChange={(open) => {
                if (!open) hideSheet();
              }}
              onOpen={onOpenSheet}
            >
              <PersonaForm />
            </CreateButton>
          </div>
        </>
      )}
    </div>
  );
}
