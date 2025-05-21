package dbc

import "time"

// Endianness for signal bit-packing
type Endianness int

const (
    LittleEndian Endianness = iota
    BigEndian
)

// MultiplexerType indicates if a signal is a mux selector or a muxed signal
type MultiplexerType int

const (
    NoMux MultiplexerType = iota
    MuxSwitch    // this signal selects which muxed signals are active
    MuxSignal    // this is one of the signals under a mux
)

// AttributeDataType indicates the kind of an attribute definition
type AttributeDataType int

const (
    AttrInt AttributeDataType = iota
    AttrFloat
    AttrString
    AttrEnum
)

// DBCFile is the root object for a parsed .dbc
type DBCFile struct {
    // Meta
    Version    string    `json:"version"`
    CreatedOn  time.Time `json:"created_on"`
    Author     string    `json:"author"`
    Licence    string    `json:"license"`
    FileName   string    `json:"filename"`

    // Symbol tables
    Nodes       []Node       `json:"nodes"`
    BaudRates   []BaudRate   `json:"baud_rates"`
    ValueTables []ValueTable `json:"value_tables"`
                             
    // Core data
    Messages   []Message             `json:"messages"`
    Attributes []AttributeDefinition `json:"attributes"`
    AttrValues []AttributeValue      `json:"attr_values"`

    // Comments (optional)
    Comments   []Comment `json:"comments"`

    // Unknown or unsupported sections can be captured raw if needed
    RawSections []RawSection `json:"raw_sections"`
}

// Node is a CAN node/transmitter
type Node struct {
    Name string `json:"name"`
}

// BaudRate declaration
type BaudRate struct {
    Rate int `json:"rate"`
}

// ValueTable maps numeric values to strings for signal enumerations
type ValueTable struct {
    Name   string         `json:"name"`
    Values map[int]string `json:"values"`
}

// Message represents a CAN frame definition
type Message struct {
    ID           uint32   `json:"id"`// CAN ID
    Name         string   `json:"name"`
    DLC          int      `json:"dlc"` // Data Length Code (0–8)
    Transmitters []string `json:"transmitters"`   // Node names
    Signals      []Signal `json:"signals"`
    Comment      string   `json:"comment"` // optional
}

// Signal within a Message
type Signal struct {
    Name           string          `json:"name"`
    StartBit       int             `json:"start_bit"`
    Length         int             `json:"length"` 
    Endianness     Endianness      `json:"endianness"`
    IsSigned       bool            `json:"is_signed"`
    Factor         float64         `json:"factor"` 
    Offset         float64         `json:"offset"`
    Minimum        float64         `json:"min"`
    Maximum        float64         `json:"max"` 
    Unit           string          `json:"unit"`
    Receivers      []string        `json:"receivers"`
    MuxType        MultiplexerType `json:"mux_type"`
    MuxValue       int             `json:"mux_value"`    
    Comment        string          `json:"comment"`
}

// AttributeDefinition defines a named attribute and where it can apply
type AttributeDefinition struct {
    Name         string            `json:"name"` 
    DataType     AttributeDataType `json:"data_type"`
    AppliesTo    []string          `json:"applies_to"` // eg "BU_", "BO_", "SG_"
    DefaultValue string            `json:"default_value"`  // stored as string; cast based on DataType
    EnumValues   []string          `json:"enum_values"` // if DataType == AttrEnum
}

// AttributeValue assigns an attribute to an object
type AttributeValue struct {
    ObjectType string `json:"object_type"` // e.g. "BO_" for message, "SG_" for signal
    ObjectName string `json:"object_name"` // the name or ID of the object
    AttrName   string `json:"attr_name"` 
    Value      string `json:"value"`
}

// Comment attaches free-form text to an object
type Comment struct {
    ObjectType string `json:"object_type"` // "BU_", "BO_", "SG_"
    ObjectName string `json:"object_name"`
    Text       string `json:"text"` 
}

// RawSection holds unparsed or extra lines
type RawSection struct {
    Keyword string   `json:"keyword"` // e.g. "BU_" or custom
    Lines   []string `json:"lines"`   // raw text lines
}
