import { GetDBCFiles, ParseDBC } from "../../wailsjs/go/main/App"
import { Button } from "./ui/button"
import { useCallback } from "react"

export function Toolbar() {
  const onOpenClick = useCallback(async () => {
    try {
      await ParseDBC()
      const dbcFiles = await GetDBCFiles()
      console.log("Parsed DBCs:", dbcFiles)
    } catch (err) {
      console.error("Open DBC failed:", err)
    }
  }, [])
  return (
    <div className="pl-16 p-1 toolbar flex items-center space-x-2 border-b">
      <Button variant="ghost" className="no-drag" onClick={onOpenClick}>
        Open
      </Button>
      <Button variant="ghost" disabled>
        Save
      </Button>
      <div className="flex-1" />
    </div>
  )
}
