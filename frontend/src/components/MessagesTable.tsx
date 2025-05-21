import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { dbc } from "../../wailsjs/go/models"

interface MessagesTableProps {
  messages: dbc.Message[] 
}

export function MessagesTable({ messages }: MessagesTableProps) {
  return (
    <div className="p-2 overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-16">DLC</TableHead>
            <TableHead>Transmitters</TableHead>
            <TableHead># Signals</TableHead>
            <TableHead>Comment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map((msg) => (
            <TableRow key={msg.id}>
              <TableCell>{msg.id}</TableCell>
              <TableCell>{msg.name}</TableCell>
              <TableCell>{msg.dlc}</TableCell>
              <TableCell>{msg.transmitters.join(", ")}</TableCell>
              <TableCell>{msg.signals.length}</TableCell>
              <TableCell>{msg.comment}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
