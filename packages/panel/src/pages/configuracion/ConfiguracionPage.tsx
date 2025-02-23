import { ApiClient } from "@/api/api.client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ConfiguracionPage = () => {
  const [isQuickBooksConnected, setIsQuickBooksConnected] = useState(false);

  useEffect(() => {
    const checkQuickBooksStatus = async () => {
      const { data } = await new ApiClient().get(
        "/config/quickbooks/status",
        {}
      );
      setIsQuickBooksConnected(data.isQuickBooksConnected);
    };
    checkQuickBooksStatus();
  }, []);

  useEffect(() => {
    if (isQuickBooksConnected) {
      const testQuickBooks = async () => {
        const { data } = await new ApiClient().get(
          "/config/quickbooks/test",
          {}
        );
        console.log(data);
      };
      testQuickBooks();
    }
  }, [isQuickBooksConnected]);

  const handleQuickBooksConnect = async () => {
    const res = await new ApiClient().get("/config/quickbooks/auth", {});
    if (res.data.url) {
      // redirect to the quickbooks oauth page
      window.location.href = res.data.url;
    } else {
      toast.error("Error al obtener la URL de conexión con QuickBooks");
    }
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Configuración del Sistema</h1>

      <Card>
        <CardHeader>
          <CardTitle>Conexión con QuickBooks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {isQuickBooksConnected
              ? "Su cuenta de QuickBooks está conectada correctamente."
              : "Conecte su cuenta de QuickBooks para sincronizar la información contable."}
          </p>

          {!isQuickBooksConnected && (
            <div className="flex justify-center">
              <Button
                onClick={handleQuickBooksConnect}
                className="flex items-center gap-2 bg-[#2CA01C] hover:bg-[#268916] text-white"
              >
                <Receipt className="h-4 w-4" />
                Conectar con QuickBooks
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfiguracionPage;
