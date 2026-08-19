export type Coordinate={lat:number;lng:number}; export type TimelinePoint=Coordinate&{timestamp:number}; export type TimelineSource='direct-array'|'semantic-segments';
export type TimelineErrorCode='malformed-json'|'unsupported-format'|'legacy-takeout'|'raw-signals-only'|'empty';
export class TimelineError extends Error { constructor(public readonly code:TimelineErrorCode, public readonly detail?:string){super(code);this.name='TimelineError'} }
