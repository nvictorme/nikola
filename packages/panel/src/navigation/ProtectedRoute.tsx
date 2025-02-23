import { useAuthStore } from "@/store/auth.store";
import { ReactNode } from "react";
import { RouteRuleCheck } from "shared/enums";
import { canCreateOrders, canSeeBalance, isSuperAdmin } from "shared/helpers";

export default function ProtectedRoute({
  children,
  routeRuleCheck,
}: {
  children: ReactNode;
  routeRuleCheck?: RouteRuleCheck;
}) {
  const { user } = useAuthStore();
  const isAdmin = isSuperAdmin(user);

  const canCreate = canCreateOrders(user);

  const showBalance = canSeeBalance(user);

  let forbidden = false;

  if (routeRuleCheck === RouteRuleCheck.isAdmin && !isAdmin) {
    forbidden = true;
  } else if (routeRuleCheck === RouteRuleCheck.canCreateOrders && !canCreate) {
    forbidden = true;
  } else if (routeRuleCheck === RouteRuleCheck.canSeeBalance && !showBalance) {
    forbidden = true;
  }

  if (forbidden) {
    return (
      <div className="flex items-center justify-center h-full">
        <h2 className="text-2xl text-gray-500">
          No tienes permisos para acceder a esta página
        </h2>
      </div>
    );
  }

  return <>{children}</>;
}
