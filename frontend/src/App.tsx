import { useState, useEffect, useMemo } from "react"
import { Toolbar } from "./components/Toolbar"
import { MessagesTable } from "./components/MessagesTable"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faX } from "@fortawesome/free-solid-svg-icons"
import { Button } from "./components/ui/button"
import { useDbcStore } from "./store/useDbcStore"
import { EventsOn } from "../wailsjs/runtime/runtime"

type TabID = number
type Tab = {
  id: TabID
  type: "messages" | "signals" // TODO: decide if this is the best method
  fileIndex: number
}

let nextTabId = 0

export default function App() {
  const [tabs, setTabs] = useState<Record<TabID, Tab>>({})
  const [activeTabID, setActiveTabID] = useState<TabID>(0)

  const files = useDbcStore((s) => s.files)
  const fetchFiles = useDbcStore((s) => s.fetchFiles)
  const pushFile = useDbcStore((s) => s.pushFile)
  const popFile = useDbcStore((s) => s.popFile)

  const removeTab = (id: TabID) => {
    const filename = files[tabs[id].fileIndex].filename
    if (filename) {
      popFile(filename)
    }

    setTabs((prevTabs) => {
      const { [id]: _, ...newTabs } = prevTabs

      if (activeTabID === id) {
        const remainingIds = Object.keys(newTabs)
          .map((k) => Number(k))
          .sort((a, b) => a - b)
        const newActive = remainingIds.length ? remainingIds[0] : 0
        setActiveTabID(newActive)
      }

      return newTabs
    })
  }

  useEffect(() => {
    const unsubscribe = EventsOn(
      "dbcfile:loaded",
      () => {
        const fileIndex = files?.length || 0 
        fetchFiles()
        console.log(files)
        const newID = nextTabId++
        setTabs((t) => (
          {...t, [newID]: { id: newID, type: "messages", fileIndex }}
        ))
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

  const tabEntries = useMemo(() => Object.entries(tabs), [tabs])

  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div 
          className={`flex w-full h-fit gap-0.5 p-0.5 ${Object.keys(tabs).length > 0 && "border-b"} border-gray-100`}
        >
          {tabEntries.map(([_, tab]) => (
            <Button
              key={tab.id}
              className={`flex ${activeTabID === tab.id && "bg-gray-100"}`}
              variant="ghost"
              onClick={() => setActiveTabID(tab.id)}
            >
              {files && files[tab.fileIndex]?.filename.split("/").pop()}
              <span
                className="p-1 text-xs hover:bg-gray-200 rounded"
                onClick={() => removeTab(tab.id)}
              >
                <FontAwesomeIcon icon={faX} />
              </span>
            </Button>
          ))}
        </div>

        {Object.keys(tabs).length !== 0 ? (
          <div className="flex-1 overflow-auto">
            {files && 
              (files.length > 0 && 
                (tabs[activeTabID] &&
                  (files[tabs[activeTabID].fileIndex] ? (
                    <MessagesTable messages={files[tabs[activeTabID].fileIndex]?.messages || []} />
            ) : (
              <div className="p-4 text-gray-400 italic">
                No file loaded
              </div>
            ))))}
          </div>
        ) : (
          <div className="m-4 italic text-gray-400">No file selected</div>
        )}
      </div>
    </div>
  )
}
