package dbc

import (
    "bufio"
    "fmt"
    "io"
    "regexp"
    "strconv"
    "strings"
)

// Parser holds parser state and the target DBCFile
type Parser struct {
    file      *DBCFile
    lineNo    int
    rawBuffer []string
		inNamespace bool
}

// NewParser instantiates a parser for one DBCFile
func NewParser() *Parser {
    return &Parser{
        file: &DBCFile{},
    }
}

// Parse reads all lines from r and returns a populated DBCFile
func (p *Parser) Parse(r io.Reader) (*DBCFile, error) {
    scanner := bufio.NewScanner(r)
    for scanner.Scan() {
        p.lineNo++
        line := strings.TrimSpace(scanner.Text())
        if line == "" {
            continue
        }
        if err := p.dispatch(line); err != nil {
            return nil, fmt.Errorf("line %d: %w", p.lineNo, err)
        }
    }
    if err := scanner.Err(); err != nil {
        return nil, err
    }
    return p.file, nil
}

var (
    // matches e.g. "NS_:" or "NS_  :" capturing "NS_" and ":"
    keywordRe = regexp.MustCompile(`^([A-Z0-9_]+)\s*(:)?`)
)

// dispatch looks at the line’s leading keyword and routes it.
// It will error if a keyword that requires “:” is missing its colon.
func (p *Parser) dispatch(line string) error {
    // quick skip
    trimmed := strings.TrimSpace(line)
    if trimmed == "" {
        return nil
    }

    // extract keyword and optional colon
    m := keywordRe.FindStringSubmatch(trimmed)
    if len(m) < 2 {
        // no keyword at all—treat as raw
        return p.collectRaw(line)
    }
    key := m[1]        // e.g. “NS_” or “BO_”
    hasColon := m[2] == ":"

    // some keywords require the colon form (NS_, BU_, etc.)
    colonRequired := map[string]bool{
        "NS_": true,
        "BS_": true,
        "BU_": true,
    }
    if colonRequired[key] && !hasColon {
        return fmt.Errorf("line %d: keyword %q missing required colon", p.lineNo, key)
    }

    // normalize to e.g. “NS_:”
    normalized := key
    if hasColon {
        normalized += ":"
    }

    if p.inNamespace {
        if normalized == "BS_:" {
            return p.parseHeaderKeyword(normalized, line)
        } else {
            return nil // should be parsing and adding information to namespace in parse struct
        }
    }

    // dispatch
    switch normalized {
    case "NS_:", "BS_:", "BU_:":
        return p.parseHeaderKeyword(normalized, line)
    case "BU_": // note: this is catch-all for BU_ without colon? probably unused
        return p.parseNodeList(line)
    case "CM_":
        return p.parseComment(line)
    case "BA_DEF_":
        return p.parseAttributeDef(line)
    case "BA_":
        return p.parseAttributeValue(line)
    case "VAL_TABLE_":
        return p.parseValueTable(line)
    case "BO_":
        return p.parseMessage(line)
    case "SG_":
        return p.parseSignal(line)
    case "CM_BO_":
        return p.parseMessageComment(line)
    case "VERSION":
        return p.parseVersion(line)
    default:
        return p.collectRaw(line)
    }
}

// collectRaw appends the line to the rawBuffer and
// flushes it as a RawSection when it ends in “;”
func (p *Parser) collectRaw(line string) error {
    p.rawBuffer = append(p.rawBuffer, line)
    if strings.HasSuffix(line, ";") {
        p.file.RawSections = append(p.file.RawSections, RawSection{
            Lines: p.rawBuffer,
        })
        p.rawBuffer = nil
    }
    return nil
}

// parseNamespace handles the start of the NS_:
// section. We enter "namespace mode" until we hit BS_:
func (p *Parser) parseNamespace(line string) error {
    // We're at the start of a namespace block.
    // Future lines (sub-keywords) are ignored at this
    // level until we hit BS_:
    _ = line
    p.inNamespace = true
    return nil
}

// parseBitTiming handles the BS_: <bitrate>;
// line. Also ends the namespace block.
func (p *Parser) parseBitTiming(line string) error {
    if p.inNamespace {
        // Exiting namespace section
        p.inNamespace = false
    }

    // Trim off the "BS_:" prefix
    // line looks like: "BS_: 500000;" or "BS_: 500000"
    parts := strings.Fields(line)
    if len(parts) < 2 {
        return nil // no bit timing value
    }
    // parts[1] may include trailing semicolon
    rateStr := strings.TrimSuffix(parts[1], ";")
    rate, err := strconv.Atoi(rateStr)
    if err != nil {
        return fmt.Errorf("invalid bus bitrate %q: %w", rateStr, err)
    }

    // Append to our DBCFile
    p.file.BaudRates = append(p.file.BaudRates, BaudRate{
        Rate: rate,
    })
    return nil
}

// parseHeaderKeyword handles NS_:, BS_:, and BU_:
func (p *Parser) parseHeaderKeyword(keyword, line string) error {
    switch keyword {
    case "NS_:":
        return p.parseNamespace(line)
    case "BS_:":
        return p.parseBitTiming(line)
    case "BU_:":
        return p.parseNodeList(line)
    }
    return nil
}

// parseNodeList handles "BU_: NODE1 NODE2 …"
func (p *Parser) parseNodeList(line string) error {
    tokens := strings.Fields(line)
    // tokens[0] == "BU_:"
    for _, node := range tokens[1:] {
        p.file.Nodes = append(p.file.Nodes, Node{Name: node})
    }
    return nil
}

// parseValueTable handles "VAL_TABLE_ TableName val "str" val "str" …;"
func (p *Parser) parseValueTable(line string) error {
    // regex: VAL_TABLE_ (\w+) ([0-9]+) "([^"]+)" … ;
    re := regexp.MustCompile(`VAL_TABLE_\s+(\w+)\s+(.*);`)
    matches := re.FindStringSubmatch(line)
    if len(matches) != 3 {
        return fmt.Errorf("invalid VAL_TABLE_ syntax")
    }
    name := matches[1]
    rest := matches[2]
    parts := strings.Fields(rest)
    values := make(map[int]string)
    for i := 0; i < len(parts); i += 2 {
        key, err := strconv.Atoi(parts[i])
        if err != nil {
            return err
        }
        str := strings.Trim(parts[i+1], `"`)
        values[key] = str
    }
    p.file.ValueTables = append(p.file.ValueTables, ValueTable{
        Name:   name,
        Values: values,
    })
    return nil
}

// parseAttributeDef handles "BA_DEF_ BO_  MSG_TX_Attr INT 0 1;"
// simplified example
func (p *Parser) parseAttributeDef(line string) error {
    // [...] use fmt.Sscanf or regex to extract Name, AppliesTo, Type, etc.
    // p.file.Attributes = append(p.file.Attributes, def)
    return nil
}

// parseAttributeValue handles "BA_ “AttrName” BO_ 123 “42”;"
func (p *Parser) parseAttributeValue(line string) error {
    return nil
}

var commentRe = regexp.MustCompile(`^CM_\s*` +
    `(?:(BO|SG|BU)_\s+([^ "\t]+)` +    // 1=objType (BO/SG/BU), 2=objRef (ID or name)
      `(?:\s+([A-Za-z0-9_]+))?` +      // 3=optional signal name for SG_
    `\s+)?` +
    `"([^"]*)"` +                      // 4=the comment text
    `\s*;?\s*$`)
// parseComment handles generic CM_ comments
func (p *Parser) parseComment(line string) error {
    m := commentRe.FindStringSubmatch(line)
    if m == nil {
        return fmt.Errorf("invalid CM_ line: %q", line)
    }
    objType   := m[1]       // e.g. "BO", "SG", "BU", or "" for file‐level
    objRef    := m[2]       // ID or name
    sigName   := m[3]       // only set if objType=="SG"
    text      := m[4]       // comment

    switch objType {
    case "BO":
        p.file.Comments = append(p.file.Comments, Comment{
            ObjectType: "BO_",
            ObjectName: objRef,
            Text:       text,
        })
    case "SG":
        p.file.Comments = append(p.file.Comments, Comment{
            ObjectType: "SG_",
            ObjectName: objRef + " " + sigName,
            Text:       text,
        })
    case "BU":
        p.file.Comments = append(p.file.Comments, Comment{
            ObjectType: "BU_",
            ObjectName: objRef,
            Text:       text,
        })
    default:
        // file‐level comment or unknown
        p.file.Comments = append(p.file.Comments, Comment{
            ObjectType: "CM_",
            ObjectName: "",
            Text:       text,
        })
    }
    return nil
}

// parseMessageComment handles a comment for a message specifically 
func (p *Parser) parseMessageComment(line string) error {
    // extract object type, object name, text
    return nil
}

// parseMessage handles "BO_ 1234 MsgName: 8 Vector__XXX"
func (p *Parser) parseMessage(line string) error {
    var (
        id   uint32
        name string
        dlc  int
        tx   string
    )
    // BO_ <ID> <Name>: <DLC> <TxList>
    fmt.Sscanf(line, "BO_ %d %s: %d %s", &id, &name, &dlc, &tx)
    msg := Message{
        ID:           id,
        Name:         name,
        DLC:          dlc,
        Transmitters: strings.Split(tx, ","),
    }
    p.file.Messages = append(p.file.Messages, msg)
    return nil
}


var versionRe = regexp.MustCompile(`^VERSION\s+"([^"]*)"\s*;?\s*$`)

func (p *Parser) parseVersion(line string) error {
    v := versionRe.FindStringSubmatch(line)
    if v == nil {
        return fmt.Errorf("invalid VERSION line: %q", line)
    }
    p.file.Version = v[1]
    return nil
}

var signalRe = regexp.MustCompile(`^SG_\s+` +                   // literal “SG_” + spaces
    `(\w+)` +                                                   // 1: Signal name
    `(?:\s+((?:m\d+M?)|(?:M(?:m\d+)?)))?` +                     // 2: Optional mux specifier, e.g. “M” or “m1”
    `\s*:\s*` +                                                  
    `(\d+)` +                                                   // 3: Start bit
    `\|` +
    `(\d+)` +                                                   // 4: Length
    `@` +
    `([01])` +                                                  // 5: Endianness (0=big,1=little)
    `([+-])` +                                                  // 6: Sign (+ unsigned, - signed)
    `\s*\(\s*` +
    `([0-9.eE+-]+)` +                                           // 7: Factor
    `\s*,\s*` +
    `([0-9.eE+-]+)` +                                           // 8: Offset
    `\s*\)\s*` +
    `\[\s*` +
    `([0-9.eE+-]+)` +                                           // 9: Minimum
    `\s*\|\s*` +
    `([0-9.eE+-]+)` +                                           // 10: Maximum
    `\s*\]\s*` +
    `"(.*?)"` +                                                 // 11: Unit (non-greedy)
    `\s+` +
    `(.+)$`)                                                    // 12: Receivers list (comma/space-separated)

func (p *Parser) parseSignal(line string) error {
    m := signalRe.FindStringSubmatch(line)
    if m == nil {
        return fmt.Errorf("invalid SG_ line: %q", line)
    }

    // m[1] = name
    // m[2] = mux specifier ("" if none)
    // m[3] = start bit
    // m[4] = length
    // m[5] = endianness
    // m[6] = sign
    // m[7] = factor
    // m[8] = offset
    // m[9] = min
    // m[10]= max
    // m[11]= unit
    // m[12]= receivers

    name := m[1]
    muxSpec := m[2] // e.g. "", "M", "m1"
    start, _ := strconv.Atoi(m[3])
    length, _ := strconv.Atoi(m[4])
    endian := BigEndian
    if m[5] == "1" {
        endian = LittleEndian
    }
    isSigned := (m[6] == "-")
    factor, _ := strconv.ParseFloat(m[7], 64)
    offset, _ := strconv.ParseFloat(m[8], 64)
    minv, _ := strconv.ParseFloat(m[9], 64)
    maxv, _ := strconv.ParseFloat(m[10], 64)
    unit := m[11]
    receivers := strings.FieldsFunc(m[12], func(r rune) bool {
        return r == ',' || r == ' '
    })

    sig := Signal{
        Name:       name,
        StartBit:   start,
        Length:     length,
        Endianness: endian,
        IsSigned:   isSigned,
        Factor:     factor,
        Offset:     offset,
        Minimum:    minv,
        Maximum:    maxv,
        Unit:       unit,
        Receivers:  receivers,
    }

    // Handle mux
    if muxSpec != "" {
        if strings.ToUpper(muxSpec) == "M" {
            sig.MuxType = MuxSwitch
        } else {
            sig.MuxType = MuxSignal
            // strip leading 'm' or 'M'
            val, err := strconv.Atoi(muxSpec[1:])
            if err == nil {
                sig.MuxValue = val
            }
        }
    }

    // Append to last message
    if len(p.file.Messages) == 0 {
        return fmt.Errorf("SG_ without preceding BO_")
    }
    lastIdx := len(p.file.Messages) - 1
    p.file.Messages[lastIdx].Signals = append(
        p.file.Messages[lastIdx].Signals, sig,
    )
    return nil
}
