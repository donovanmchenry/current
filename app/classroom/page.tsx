import type { Metadata } from "next";

import { CurrentWorkspace } from "../current-workspace";

export const metadata: Metadata = {
  title: "Current Classroom",
  description: "Teacher-controlled learning paths, student evidence, and curriculum updates in Current.",
};

export default function ClassroomPage() {
  return <CurrentWorkspace initialView="classroom" />;
}
