import { Step } from "react-joyride";

export const transaccionFormTourSteps: Step[] = [
  {
    target: ".monto-input",
    content: "Ingresa el monto de la transacción aquí.",
    placement: "right",
  },
  {
    target: ".tipo-select",
    content:
      "Selecciona el tipo de transacción. Puede ser un pago, reembolso u otro tipo según tus permisos.",
    placement: "left",
  },
  {
    target: ".descripcion-input",
    content: "Describe el motivo o detalles de la transacción.",
    placement: "top",
  },
  {
    target: ".archivos-uploader",
    content:
      "Puedes adjuntar comprobantes u otros documentos relacionados con la transacción.",
    placement: "top",
  },
];
