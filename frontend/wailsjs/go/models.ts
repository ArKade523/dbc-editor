export namespace dbc {
	
	export class AttributeDefinition {
	    name: string;
	    data_type: number;
	    applies_to: string[];
	    default_value: string;
	    enum_values: string[];
	
	    static createFrom(source: any = {}) {
	        return new AttributeDefinition(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.data_type = source["data_type"];
	        this.applies_to = source["applies_to"];
	        this.default_value = source["default_value"];
	        this.enum_values = source["enum_values"];
	    }
	}
	export class AttributeValue {
	    object_type: string;
	    object_name: string;
	    attr_name: string;
	    value: string;
	
	    static createFrom(source: any = {}) {
	        return new AttributeValue(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.object_type = source["object_type"];
	        this.object_name = source["object_name"];
	        this.attr_name = source["attr_name"];
	        this.value = source["value"];
	    }
	}
	export class BaudRate {
	    rate: number;
	
	    static createFrom(source: any = {}) {
	        return new BaudRate(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.rate = source["rate"];
	    }
	}
	export class Comment {
	    object_type: string;
	    object_name: string;
	    text: string;
	
	    static createFrom(source: any = {}) {
	        return new Comment(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.object_type = source["object_type"];
	        this.object_name = source["object_name"];
	        this.text = source["text"];
	    }
	}
	export class RawSection {
	    keyword: string;
	    lines: string[];
	
	    static createFrom(source: any = {}) {
	        return new RawSection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.keyword = source["keyword"];
	        this.lines = source["lines"];
	    }
	}
	export class Signal {
	    name: string;
	    start_bit: number;
	    length: number;
	    endianness: number;
	    is_signed: boolean;
	    factor: number;
	    offset: number;
	    min: number;
	    max: number;
	    unit: string;
	    receivers: string[];
	    mux_type: number;
	    mux_value: number;
	    comment: string;
	
	    static createFrom(source: any = {}) {
	        return new Signal(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.start_bit = source["start_bit"];
	        this.length = source["length"];
	        this.endianness = source["endianness"];
	        this.is_signed = source["is_signed"];
	        this.factor = source["factor"];
	        this.offset = source["offset"];
	        this.min = source["min"];
	        this.max = source["max"];
	        this.unit = source["unit"];
	        this.receivers = source["receivers"];
	        this.mux_type = source["mux_type"];
	        this.mux_value = source["mux_value"];
	        this.comment = source["comment"];
	    }
	}
	export class Message {
	    id: number;
	    name: string;
	    dlc: number;
	    transmitters: string[];
	    signals: Signal[];
	    comment: string;
	
	    static createFrom(source: any = {}) {
	        return new Message(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.dlc = source["dlc"];
	        this.transmitters = source["transmitters"];
	        this.signals = this.convertValues(source["signals"], Signal);
	        this.comment = source["comment"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ValueTable {
	    name: string;
	    values: Record<number, string>;
	
	    static createFrom(source: any = {}) {
	        return new ValueTable(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.values = source["values"];
	    }
	}
	export class Node {
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new Node(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	    }
	}
	export class DBCFile {
	    version: string;
	    // Go type: time
	    created_on: any;
	    author: string;
	    license: string;
	    filename: string;
	    nodes: Node[];
	    baud_rates: BaudRate[];
	    value_tables: ValueTable[];
	    messages: Message[];
	    attributes: AttributeDefinition[];
	    attr_values: AttributeValue[];
	    comments: Comment[];
	    raw_sections: RawSection[];
	
	    static createFrom(source: any = {}) {
	        return new DBCFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.created_on = this.convertValues(source["created_on"], null);
	        this.author = source["author"];
	        this.license = source["license"];
	        this.filename = source["filename"];
	        this.nodes = this.convertValues(source["nodes"], Node);
	        this.baud_rates = this.convertValues(source["baud_rates"], BaudRate);
	        this.value_tables = this.convertValues(source["value_tables"], ValueTable);
	        this.messages = this.convertValues(source["messages"], Message);
	        this.attributes = this.convertValues(source["attributes"], AttributeDefinition);
	        this.attr_values = this.convertValues(source["attr_values"], AttributeValue);
	        this.comments = this.convertValues(source["comments"], Comment);
	        this.raw_sections = this.convertValues(source["raw_sections"], RawSection);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	

}

