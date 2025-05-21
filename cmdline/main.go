package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"raydoc.dev/dbc-editor/dbc"
)

func main() {
    // Define and parse command‐line flags
    var path string
    flag.StringVar(&path, "f", "", "Path to the .dbc file to parse")
    flag.Parse()

    if path == "" {
        fmt.Fprintln(os.Stderr, "Usage: dbcparser -f <path/to/file.dbc>")
        os.Exit(1)
    }

    // Open the DBC file
    file, err := os.Open(path)
    if err != nil {
        log.Fatalf("Error opening file: %v", err)
    }
    defer file.Close()

    // Parse it
    parser := dbc.NewParser()
    dbcFile, err := parser.Parse(file)
    if err != nil {
        log.Fatalf("Parse error: %v", err)
    }

    // Output a brief summary
		fmt.Printf("Parsed DBC: %s\n", path)
		fmt.Printf("  version=%q, author=%q\n", dbcFile.Version, dbcFile.Author)
    fmt.Printf("  Nodes:        %d\n", len(dbcFile.Nodes))
    fmt.Printf("  BaudRates:    %d\n", len(dbcFile.BaudRates))
    fmt.Printf("  Messages:     %d\n", len(dbcFile.Messages))

    totalSignals := 0
    for _, msg := range dbcFile.Messages {
        totalSignals += len(msg.Signals)
    }
    fmt.Printf("    └─ Signals: %d\n", totalSignals)

    fmt.Printf("  ValueTables:  %d\n", len(dbcFile.ValueTables))
    fmt.Printf("  Attributes:   %d defs, %d values\n",
        len(dbcFile.Attributes), len(dbcFile.AttrValues))
    fmt.Printf("  Comments:     %d\n", len(dbcFile.Comments))
}

