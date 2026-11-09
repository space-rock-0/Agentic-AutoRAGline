export type Cell = string | number | null;
export type SourceTable = {
  id: string;
  title: string;
  page: number;
  headers: string[];
  rows: Cell[][];
  note: string;
};
export type Score = { method: string; datasets: number[][][] };
export type Research = {
  tables: SourceTable[];
  scores: Score[];
  figures: {
    id: number;
    page: number;
    title: string;
    caption: string;
    file: string;
  }[];
  appendix: { title: string; page: number; text: string }[];
  references: string[];
};
