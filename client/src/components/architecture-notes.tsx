import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ArchitectureNotesProps {
  note: string;
}

export function ArchitectureNotes({ note }: ArchitectureNotesProps) {
  const renderNote = (text: string) => {
    return text.split('**').map((part, index) => 
      index % 2 === 1 ? (
        <strong key={index} className="font-bold text-primary">
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center">
          <Zap size={14} className="mr-2 text-yellow-500" />
          Architectural Note
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={note}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-sm leading-relaxed space-y-2"
          >
            <p>
              {renderNote(note || "No architectural notes for this commit.")}
            </p>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}