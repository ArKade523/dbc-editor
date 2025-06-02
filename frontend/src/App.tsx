import { useState, useEffect, useMemo } from "react"
import { Toolbar } from "./components/Toolbar"
import { MessagesTable } from "./components/MessagesTable"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faX } from "@fortawesome/free-solid-svg-icons"
import { Button } from "./components/ui/button"
import { useDbcStore } from "./store/useDbcStore"
import { EventsOn } from "../wailsjs/runtime/runtime"

export default function App() {
  const files = useDbcStore((s) => s.files)
  const tabs = useDbcStore(s => s.tabs)
  const tabOrder = useDbcStore(s => s.tabOrder)
  const activeTabID = useDbcStore(s => s.activeTabID)
  const fetchFiles = useDbcStore((s) => s.fetchFiles)
  const pushFile = useDbcStore((s) => s.pushFile)
  const addTab = useDbcStore((s) => s.addTab)
  const removeTab = useDbcStore((s) => s.removeTab)
  const setActiveTab = useDbcStore(s => s.setActiveTab)

  useEffect(() => {
    const unsubscribe = EventsOn(
      "dbcfile:loaded", async () => {
        await fetchFiles()
        const newIndex = useDbcStore.getState().files.length - 1
        console.log(files)
        addTab(newIndex)
      }
    )
    return () => {
      unsubscribe()
    }
  }, [files?.length, pushFile])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const hasTabs = tabOrder.length > 0

  const activeTab = activeTabID !== null ? tabs[activeTabID] : undefined

  const activeFile =
    activeTab && files[activeTab.fileIndex]
      ? files[activeTab.fileIndex]
      : undefined

  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div 
          className={`flex w-full h-fit gap-0.5 p-0.5 ${Object.keys(tabs).length > 0 && "border-b"} border-gray-100`}
        >
          {tabOrder.map((id) => (
            <Button
              key={id}
              className={`flex ${activeTabID === id && "bg-gray-100"}`}
              variant="ghost"
              onClick={() => setActiveTab(id)}
            >
              {files && files[tabs[id].fileIndex]?.filename.split("/").pop()}
              <span
                className="p-1 text-xs hover:bg-gray-200 rounded"
                onClick={() => removeTab(id)}
              >
                <FontAwesomeIcon icon={faX} />
              </span>
            </Button>
          ))}
        </div>

        {hasTabs ? (
          <div className="flex-1 overflow-auto">
            {activeFile ? (
              <MessagesTable messages={activeFile.messages} />
            ) : (
              <div className="p-4 text-gray-400 italic">
                No file loaded
              </div>
            )}
          </div>
        ) : (
          <div className="m-4 italic text-gray-400">
            No tab selected
          </div>
        )}
      </div>
    </div>
  )
}
