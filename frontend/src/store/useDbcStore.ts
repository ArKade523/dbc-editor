import { GetDBCFiles } from "../../wailsjs/go/main/App"
import { dbc } from "wailsjs/go/models"
import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface DbcState {
  files: dbc.DBCFile[];
  fetchFiles: () => Promise<void>;
  pushFile: (file: dbc.DBCFile) => void;
  popFile: (filename: string) => void;
}

export const useDbcStore = create<DbcState>()(
  devtools((set, get) => ({
    files: [],

    fetchFiles: async () => {
      const files = await GetDBCFiles();
      set({ files });
    },

    pushFile: (file: dbc.DBCFile) => {
      // guard: always treat get().files as an array
      const current = get().files || []
      set({ files: [...current, file] }, false, "pushFile")
    },

    popFile: (filename: string) => {
      // guard: always treat get().files as an array
      const current = get().files || []
      set({ files: current.filter((x) => x.filename !== filename) }, false, "popFile")
    },
  }))
);

