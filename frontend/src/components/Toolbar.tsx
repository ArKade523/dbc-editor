import { useDbcStore } from "@/store/useDbcStore"
import { ParseDBC, SaveFile, SaveFileAs } from "../../wailsjs/go/main/App"
import { Button } from "./ui/button"
import { useCallback } from "react"

export function Toolbar() {
  const tabs = useDbcStore(s => s.tabs)
  const activeTabID = useDbcStore(s => s.activeTabID)

  const onOpenClick = useCallback(async () => {
    try {
      await ParseDBC()
    } catch (err) {
      console.error("Open DBC failed:", err)
    }
  }, [])

  const onSaveClick = useCallback(async () => {
    try {
      if (activeTab) {
        console.log("saving file")
        await SaveFile(activeTab.fileIndex)
      }
    } catch (err) {
      console.error("Save DBC failed:", err)
    }
  }, [])


  const onSaveAsClick = useCallback(async () => {
    console.log("saving file as")
    try {
      if (activeTab) {
        const error = await SaveFileAs(activeTab.fileIndex)
        console.log(error)
      }
    } catch (err) {
      console.error("Save DBC failed:", err)
    }
  }, [])

  const activeTab = activeTabID !== null ? tabs[activeTabID] : undefined

  return (
    <div className="pl-16 p-1 toolbar flex items-center space-x-2 border-b">
      <Button variant="ghost" className="no-drag" onClick={onOpenClick}>
        Open
      </Button>
      <Button 
        variant="ghost" 
        className="no-drag" 
        onClick={onSaveClick}
        disabled={activeTab === undefined}
      >
        Save
      </Button>
      <Button 
        variant="ghost" 
        className="no-drag" 
        onClick={onSaveAsClick}
        disabled={activeTab === undefined}
      >
        Save As
      </Button>
      <div className="flex-1" />
    </div>
  )
}
