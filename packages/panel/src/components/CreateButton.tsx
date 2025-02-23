import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PlusCircle } from "lucide-react";

interface CreateButtonProps {
  title: string;
  buttonText: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  children: React.ReactNode;
}

const CreateButton: React.FC<CreateButtonProps> = ({
  title,
  buttonText,
  open,
  onOpenChange,
  onOpen,
  children,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <button
        className="text-blue-500 flex gap-1"
        onClick={onOpen}
        type="button"
      >
        <PlusCircle size={24} /> {buttonText}
      </button>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{children}</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

export default CreateButton;
