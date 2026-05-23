"use client";

import { Input } from "@/components/ui/input";
import { useState } from "react";

export function SimulatedFileInput({
  name,
  defaultValue = "",
  label = "Adjunto (demo)",
}: {
  name: string;
  defaultValue?: string;
  label?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={value} />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="URL o referencia de documento"
      />
      <label className="flex cursor-pointer flex-col gap-1 text-xs text-slate-500">
        <span>{label}</span>
        <input
          type="file"
          className="text-xs file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setValue(`archivo:${file.name}`);
          }}
        />
      </label>
    </div>
  );
}
