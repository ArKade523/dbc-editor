package dbc

import (
	"fmt"
	"os"
	"strings"
)

// Save writes the DBCFile to the given path in standard DBC format.
func (f *DBCFile) Save(path string) error {
    file, err := os.Create(path)
    if err != nil {
        return err
    }
    defer file.Close()

    // 1) VERSION
    if f.Version != "" {
        fmt.Fprintf(file, `VERSION "%s";\n\n`, f.Version)
    }

    // 2) NS_, BS_, BU_
    file.WriteString("NS_:\n\n") // minimal: we ignore sub-keywords
    if len(f.BaudRates) > 0 {
        // write the first bitrate
        fmt.Fprintf(file, "BS_: %d;\n\n", f.BaudRates[0].Rate)
    }
    if len(f.Nodes) > 0 {
        names := make([]string, len(f.Nodes))
        for i, n := range f.Nodes {
            names[i] = n.Name
        }
        fmt.Fprintf(file, "BU_: %s;\n\n", strings.Join(names, " "))
    }

    // 3) Value Tables
    for _, vt := range f.ValueTables {
        parts := []string{}
        for k, v := range vt.Values {
            parts = append(parts, fmt.Sprintf("%d \"%s\"", k, v))
        }
        fmt.Fprintf(file, "VAL_TABLE_ %s %s;\n", vt.Name, strings.Join(parts, " "))
    }
    if len(f.ValueTables) > 0 {
        file.WriteString("\n")
    }

    // 4) Attributes (definitions and values)
    for _, def := range f.Attributes {
        appl := strings.Join(def.AppliesTo, " ")
        if def.DataType == AttrEnum {
            fmt.Fprintf(file, "BA_DEF_ %s %s ENUM %s ;\n",
                appl, def.Name, strings.Join(def.EnumValues, " "))
        } else {
            dt := map[AttributeDataType]string{
                AttrInt:    "INT",
                AttrFloat:  "FLOAT",
                AttrString: "STRING",
            }[def.DataType]
            fmt.Fprintf(file, "BA_DEF_ %s %s %s %s;\n",
                appl, def.Name, dt, def.DefaultValue)
        }
    }
    if len(f.Attributes) > 0 {
        file.WriteString("\n")
    }
    for _, av := range f.AttrValues {
        fmt.Fprintf(file, "BA_ %s %s %s %s;\n",
            av.ObjectType, av.ObjectName, av.AttrName, av.Value)
    }
    if len(f.AttrValues) > 0 {
        file.WriteString("\n")
    }

    // 5) Comments
    for _, c := range f.Comments {
        switch c.ObjectType {
        case "BO_":
            fmt.Fprintf(file, "CM_ BO_ %s \"%s\";\n",
                c.ObjectName, c.Text)
        case "SG_":
            // ObjectName is "MsgID SigName"
            parts := strings.SplitN(c.ObjectName, " ", 2)
            if len(parts) == 2 {
                fmt.Fprintf(file, "CM_ SG_ %s %s \"%s\";\n",
                    parts[0], parts[1], c.Text)
            }
        case "BU_":
            fmt.Fprintf(file, "CM_ BU_ %s \"%s\";\n",
                c.ObjectName, c.Text)
        default:
            fmt.Fprintf(file, "CM_ \"%s\";\n", c.Text)
        }
    }
    if len(f.Comments) > 0 {
        file.WriteString("\n")
    }

    // 6) Messages + Signals
    for _, msg := range f.Messages {
        tx := strings.Join(msg.Transmitters, ",")
        fmt.Fprintf(file, "BO_ %d %s: %d %s\n",
            msg.ID, msg.Name, msg.DLC, tx)
        for _, sig := range msg.Signals {
            // mux
            mux := ""
            switch sig.MuxType {
            case MuxSwitch:
                mux = " M"
            case MuxSignal:
                mux = fmt.Sprintf(" m%d", sig.MuxValue)
            }
            end := "0"
            if sig.Endianness == LittleEndian {
                end = "1"
            }
            sign := "+"
            if sig.IsSigned {
                sign = "-"
            }
            rec := strings.Join(sig.Receivers, ",")
            fmt.Fprintf(file, " SG_ %s%s : %d|%d@%s%s (%g,%g) [%g|%g] \"%s\" %s\n",
                sig.Name, mux,
                sig.StartBit, sig.Length, end, sign,
                sig.Factor, sig.Offset,
                sig.Minimum, sig.Maximum,
                sig.Unit, rec)
        }
        file.WriteString("\n")
    }

    return nil
}
