import { GetDBCFiles } from "../../wailsjs/go/main/App"
import { dbc } from "wailsjs/go/models"
import { create } from "zustand"
import { devtools } from "zustand/middleware"

type TabID = number
type Tab = {
  id: TabID
  fileIndex: number
}

interface DbcState {
  files: dbc.DBCFile[]
  // files actions
  fetchFiles: () => Promise<void>
  pushFile: (file: dbc.DBCFile) => void
  popFile: (filename: string) => void

  // tab state
  tabs: Record<TabID, Tab>
  tabOrder: TabID[]
  activeTabID: TabID | null

  // tab actions
  addTab: (fileIndex: number) => void
  removeTab: (id: TabID) => void
  setActiveTab: (id: TabID | null) => void
}

let nextTabId: TabID = 1

export const useDbcStore = create<DbcState>()(
  devtools((set, get) => ({
    files: [],
    tabs: {},
    tabOrder: [],
    activeTabID: null,

    fetchFiles: async () => {
      const files = await GetDBCFiles();
      set({ files });
    },

    pushFile: (file: dbc.DBCFile) => {
      const current = get().files || []
      set({ files: [...current, file] }, false, "pushFile")
    },

    popFile: (filename: string) => {
      const current = get().files || []
      set({ files: current.filter((x) => x.filename !== filename) }, false, "popFile")
    },

    addTab: (fileIndex) => {
      const id = nextTabId++
      set((state) => ({
        tabs: {
          ...state.tabs,
          [id]: { id, fileIndex },
        },
        tabOrder: [...state.tabOrder, id],
        activeTabID: id,
      }), false, "addTab")
    },

    removeTab: (id) => {
      set((state) => {
        // Remove tab entry
        const { [id]: _, ...newTabs } = state.tabs
        // Remove from order
        const newOrder = state.tabOrder.filter((tid) => tid !== id)
        // Determine new active
        const wasActive = state.activeTabID === id
        const newActive = wasActive
          ? newOrder.length > 0
            ? newOrder[0]
            : null
          : state.activeTabID

        if (state.tabOrder.length === 0) state.activeTabID = null

        return {
          tabs: newTabs,
          tabOrder: newOrder,
          activeTabID: newActive,
        }
      }, false, "removeTab")
    },

    setActiveTab: (id) => {
      set({ activeTabID: id }, false, "setActiveTab")
    },
  }))
);

