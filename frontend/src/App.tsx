import { useState, useEffect } from "react"
import { Toolbar } from "./components/Toolbar"
import { MessagesTable } from "./components/MessagesTable"
import { dbc } from "../wailsjs/go/models"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faX, faRefresh } from "@fortawesome/free-solid-svg-icons"
import { Button } from "./components/ui/button"
import { useDbcStore } from "./store/useDbcStore"
import { EventsOn } from "../wailsjs/runtime/runtime"

type TabID = number
type Tab = {
  id: TabID
  type: "messages" | "signals" // TODO: decide if this is the best method
  file?: dbc.DBCFile
}

let nextTabId = 0

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabID, setActiveTabID] = useState<TabID | null>(null)

  const files = useDbcStore((s) => s.files)
  const fetchFiles = useDbcStore((s) => s.fetchFiles)
  const pushFile = useDbcStore((s) => s.pushFile)

  // const addTab = () => {
  //   if (files.length === 0) return;
  //   const fileIndex = tabs.length % files.length; // or your own logic
  //   const newID = nextTabId++;
  //   setTabs((t) => [...t, { id: newID, type: "messages", fileIndex }]);
  //   setActiveTabID(newID);
  // };

  const removeTab = (id: TabID) => {
    setTabs((t) => t.filter((x) => x.id !== id));
    if (activeTabID === id) setActiveTabID(null);
  };

  useEffect(() => {
    const unsubscribe = EventsOn(
      "dbcfile:loaded",
      (event) => {
        const file = event as dbc.DBCFile
        pushFile(file)
        // open a new tab pointing at the last file index
        const fileIndex = files?.length || 0 // before pushing, so new file is at files.length
        const newID = nextTabId++
        setTabs((t) => [...t, { id: newID, type: "messages", fileIndex }])
        setActiveTabID(newID)
      }
    )
    return () => {
      unsubscribe()
    }
  }, [files?.length, pushFile])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex w-full h-fit">
          <Button variant="ghost" className="no-drag" onClick={fetchFiles}>
            <FontAwesomeIcon icon={faRefresh} />
          </Button>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className="border-r last:border-r-0 flex flex-col"
            >
              {/* Pane header */}
              <div className="flex items-center justify-between bg-gray-100 p-2 border border-red-600">
                <span className="font-medium" onClick={() => setActiveTabID(tab.id)}>
                {tab.id} ({tab.type})
                </span>
                <button
                  className="p-1 text-xs hover:bg-gray-200 rounded"
                  onClick={() => removeTab(tab.id)}
                >
                  <FontAwesomeIcon icon={faX} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {activeTabID !== null && (
          <div className="flex-1 overflow-auto">
            {tabs[activeTabID]?.file ? (
              tabs[activeTabID].type === "messages" ? (
                <MessagesTable messages={tabs[activeTabID].file?.messages || []} />
              ) : (
                <div className="p-4 text-gray-500">
                  SignalsTable coming soon…
                </div>
              )
            ) : (
              <div className="p-4 text-gray-400 italic">
                No file loaded
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
