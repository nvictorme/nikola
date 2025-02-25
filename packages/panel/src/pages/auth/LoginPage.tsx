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
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

type LoginForm = {
  email: string;
  password: string;
};

const LoginPage: React.FC = () => {
  const [showReset, setShowReset] = useState<boolean>(false);

  const { signIn, recoverPassword } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = handleSubmit(async ({ email, password }) => {
    if (showReset) {
      await recoverPassword({ email });
    } else {
      await signIn({ email, password });
    }
  });

  return (
    <Card className="w-full max-w-sm p-4 m-auto">
      <CardHeader>
        <Avatar className="w-20 h-20 mx-auto mb-4">
          <AvatarImage src="/favicon.png" />
        </Avatar>
        <CardTitle className="text-xl">
          {import.meta.env.VITE_COMPANY_NAME}
        </CardTitle>
        <CardDescription>
          {showReset
            ? `Ingresa tu e-mail y haz click en el botón debajo para recibir un enlace de recuperación`
            : `Ingresa tus credenciales para continuar`}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={onSubmit} className="flex flex-col space-y-4">
          <Input
            type="email"
            placeholder="E-mail"
            {...register("email", { required: "E-mail inválido" })}
          />
          {errors.email && (
            <span className="text-red-600">{errors.email.message}</span>
          )}
          {!showReset ? (
            <>
              <Input
                type="password"
                placeholder="Password"
                {...register("password", { required: "Password requerido" })}
              />
              {errors.password && (
                <span className="text-red-600">{errors.password.message}</span>
              )}
            </>
          ) : null}
          <Button type="submit">
            {showReset ? "Recuperar password" : "Iniciar Sesión"}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        {showReset ? (
          <p className="text-sm">
            <Button variant="link" onClick={() => setShowReset(false)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Button>
          </p>
        ) : (
          <p className="text-sm">
            ¿Olvidaste tu password?{" "}
            <Button variant="link" onClick={() => setShowReset(true)}>
              Recupéralo aquí
            </Button>
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

export default LoginPage;
