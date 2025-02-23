import { Step } from "react-joyride";

export const balanceTourSteps: Step[] = [
  {
    target: ".balance-page-title",
    content:
      "Bienvenido a la página de Balance y Transacciones. Aquí podrás gestionar todas tus transacciones y ver tu balance actual.",
    placement: "bottom",
  },
  {
    target: ".balance-stats",
    content:
      "En esta sección puedes ver un resumen de tu situación financiera: tu balance actual, pagos pendientes y reembolsos pendientes.",
    placement: "bottom",
  },
  {
    target: ".distribuidor-selector",
    content:
      "Como administrador, puedes seleccionar diferentes distribuidores para ver y gestionar sus transacciones.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".nueva-transaccion-trigger",
    content:
      "Haz clic aquí para crear una nueva transacción. Podrás registrar pagos, reembolsos y otros tipos de movimientos.",
    placement: "bottom",
    spotlightClicks: true,
  },
  {
    target: ".historial-transacciones",
    content:
      "Aquí puedes ver el historial completo de transacciones, con detalles y estados de cada una.",
    placement: "top",
  },
];
