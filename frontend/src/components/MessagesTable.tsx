import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { dbc } from "../../wailsjs/go/models"
import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons"

interface MessagesTableProps {
  messages: dbc.Message[] 
}

export function MessagesTable({ messages }: MessagesTableProps) {
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [focusedMessage, setFocusedMessage] = useState<dbc.Message | null>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        setIsFocused(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  if (isFocused) {
    return (
      <div className="p-4 overflow-auto h-full">
        <div className="flex items-center">
          <Button 
            variant="ghost"
            onClick={() => {
              setIsFocused(false)
            }}
            title="Back to Messages (esc)"
            className="mr-1"
          >
            <FontAwesomeIcon icon={faAngleLeft} />
          </Button>
          <div className="flex flex-col">
            <span className="py-0 my-0 text-gray-400 text-xs italic">Message</span>
            <h2 className="py-0 my-0">{focusedMessage?.name}</h2>
          </div>
        </div>
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-16">Max</TableHead>
              <TableHead className="w-16">Min</TableHead>
              <TableHead className="w-16">Length</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Factor</TableHead>
              <TableHead className="w-16">Offset</TableHead>
              <TableHead className="w-24">Is Signed</TableHead>
              <TableHead className="w-24">Start Bit</TableHead>
              <TableHead>Endianness</TableHead>
              <TableHead>Comment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {focusedMessage?.signals.map((sig) => 
              <TableRow key={sig.name}>
                <TableCell>{sig.name}</TableCell>
                <TableCell>{sig.max}</TableCell>
                <TableCell>{sig.min}</TableCell>
                <TableCell>{sig.length}</TableCell>
                <TableCell>{sig.unit}</TableCell>
                <TableCell>{sig.factor}</TableCell>
                <TableCell>{sig.offset}</TableCell>
                <TableCell>{sig.is_signed}</TableCell>
                <TableCell>{sig.start_bit}</TableCell>
                <TableCell>{sig.endianness}</TableCell>
                <TableCell>{sig.comment}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="p-2 overflow-auto h-full">
      <Table className="static">
        <TableHeader className="sticky top-0 z-10">
          <TableRow>
            <TableHead className="w-24">ID (hex)</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-16">DLC</TableHead>
            <TableHead>Transmitters</TableHead>
            <TableHead># Signals</TableHead>
            <TableHead>Comment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages?.map((msg) => 
            <TableRow 
              key={msg.id} 
              onClick={() => {
                setFocusedMessage(msg)
              }}
              onDoubleClick={() => {
                setIsFocused(true)
              }}
              className={`cursor-pointer ${focusedMessage === msg && "border-blue-300"}`}
            >
              <TableCell>0x{msg.id.toString(16).toUpperCase()}</TableCell>
              <TableCell>{msg.name}</TableCell>
              <TableCell>{msg.dlc}</TableCell>
              <TableCell>{msg.transmitters.join(", ")}</TableCell>
              <TableCell>{msg.signals?.length}</TableCell>
              <TableCell>{msg.comment}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
