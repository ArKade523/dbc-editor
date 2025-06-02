package main

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"raydoc.dev/dbc-editor/dbc"
)

// App struct
type App struct {
	ctx context.Context
  dbcFiles []dbc.DBCFile
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	// Perform your setup here
	a.ctx = ctx
}

// domReady is called after front-end resources have been loaded
func (a App) domReady(ctx context.Context) {
	// Add your action here
}

// beforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue, false will continue shutdown as normal.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	return false
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Perform your teardown here
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) SaveFile(idx int) error {
    if idx < 0 || idx >= len(a.dbcFiles) {
        return fmt.Errorf("SaveFile: index %d out of range", idx)
    }
    dbcFile := a.dbcFiles[idx]

    if err := dbcFile.Save(dbcFile.FileName); err != nil {
        return fmt.Errorf("could not save DBC: %w", err)
    }

    return nil
}

func (a *App) SaveFileAs(idx int) error {
    if idx < 0 || idx >= len(a.dbcFiles) {
        return fmt.Errorf("SaveFile: index %d out of range", idx)
    }
    dbcFile := a.dbcFiles[idx]

    path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
        Title:           "Save DBC File",
				DefaultFilename: dbcFile.FileName[strings.LastIndex(dbcFile.FileName, "/")+1:], // oneliner to get last element of string split
        Filters: []runtime.FileFilter{
            {DisplayName: "DBC Files", Pattern: "*.dbc"},
            {DisplayName: "All Files", Pattern: "*.*"},
        },
    })
    if err != nil {
        return err
    }

    if path == "" {
        return nil
    }
    
    if err := dbcFile.Save(path); err != nil {
        return fmt.Errorf("could not save DBC: %w", err)
    }

    return nil
}

func (a *App) ParseDBC() error {
		selection, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
        Title: "Select File",
        Filters: []runtime.FileFilter{
            {
                DisplayName: "DBC files (*.dbc)",
                Pattern:     "*.dbc",
            }, 
				},
    })
		if err != nil {
			  return fmt.Errorf("error opening dbc file: %w", err)
		}

    // Open the DBC file
    file, err := os.Open(selection)
    if err != nil {
        return fmt.Errorf("error opening file: %w", err)
    }
    defer file.Close()

    // Parse it
    parser := dbc.NewParser()
    dbcFile, err := parser.Parse(file)
    if err != nil {
        return fmt.Errorf("parse error: %w", err)
    }

		dbcFile.FileName = selection

		a.dbcFiles = append(a.dbcFiles, *dbcFile)

		runtime.EventsEmit(a.ctx, "dbcfile:loaded")

		return nil
}

func (a *App) GetDBCFiles() []dbc.DBCFile {
	  return a.dbcFiles
}
