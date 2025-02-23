import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth.store";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { passwordValidationPattern } from "shared/constants";

type ResetForm = {
  password: string;
  confirmation: string;
};

const ResetPage: React.FC = () => {
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const token = search.get("token");
  const hash = search.get("hash");

  const { resetPassword } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>();

  const onSubmit = handleSubmit(async ({ password, confirmation }) => {
    if (!token || !hash) return;
    if (password !== confirmation) {
      return toast.error("Las contraseñas no coinciden", {
        duration: 2000,
        position: "top-center",
        className: "text-red-600",
      });
    }
    await resetPassword({ password, confirmation, hash, token });
  });

  return (
    <Card className="w-full max-w-sm p-4 m-auto">
      <CardHeader>
        <CardTitle className="text-xl">Inflalo Matrix</CardTitle>
        <CardDescription>
          Establece y confirma tu nuevo password
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={onSubmit} className="flex flex-col space-y-4">
          <Input
            type="password"
            placeholder="Password"
            {...register("password", {
              required: "Password requerido",
              pattern: {
                value: passwordValidationPattern,
                message: "Password no cumple con los requisitos",
              },
            })}
          />
          {errors.password && (
            <span className="text-red-600">{errors.password.message}</span>
          )}
          <Input
            type="password"
            placeholder="Confirmar Password"
            {...register("confirmation", {
              required: "Confirmar Password requerido",
              pattern: {
                value: passwordValidationPattern,
                message: "Password no cumple con los requisitos",
              },
            })}
          />
          {errors.confirmation && (
            <span className="text-red-600">{errors.confirmation.message}</span>
          )}
          <Button type="submit">Actualizar Password</Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm items-center mx-auto">
          <Button variant="link" onClick={() => (window.location.href = "/")}>
            Iniciar Sesión
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
};

export default ResetPage;
